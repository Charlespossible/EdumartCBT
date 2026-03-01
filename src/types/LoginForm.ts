export interface LoginFormData {
    email: string;
    password: string;
  }
  
  export interface LoginFormProps {
    onSubmit: (data: LoginFormData) => void;
  }

  export interface user {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  }
 