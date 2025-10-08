-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('citizen', 'admin');

-- Create enum for registration types
CREATE TYPE public.registration_type AS ENUM ('birth', 'death');

-- Create enum for registration status
CREATE TYPE public.registration_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  full_name TEXT,
  national_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create registrations table
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  registration_type registration_type NOT NULL,
  status registration_status DEFAULT 'pending' NOT NULL,
  
  -- Person details
  person_full_name TEXT NOT NULL,
  person_date_of_event DATE NOT NULL,
  person_place_of_event TEXT NOT NULL,
  person_gender TEXT,
  
  -- Parent/Next of kin details
  parent_guardian_name TEXT,
  parent_guardian_id TEXT,
  
  -- Additional information
  hospital_facility TEXT,
  doctor_name TEXT,
  additional_notes TEXT,
  
  -- Status tracking
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on registrations
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('registration-documents', 'registration-documents', false);

-- Create documents table to track uploads
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for registrations
CREATE POLICY "Users can view own registrations"
  ON public.registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all registrations"
  ON public.registrations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own registrations"
  ON public.registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update registrations"
  ON public.registrations FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for documents
CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.registrations
      WHERE registrations.id = documents.registration_id
      AND registrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all documents"
  ON public.documents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can upload documents for own registrations"
  ON public.documents FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.registrations
      WHERE registrations.id = documents.registration_id
      AND registrations.user_id = auth.uid()
    )
  );

-- Storage policies for registration-documents bucket
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'registration-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'registration-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'registration-documents' AND
    public.has_role(auth.uid(), 'admin')
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Assign citizen role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for registrations table
ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;