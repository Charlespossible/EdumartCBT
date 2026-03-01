import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaCog, FaSchool, FaBook, FaLock, FaBell } from 'react-icons/fa';

interface SchoolSettings {
  schoolName: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  defaultExamDuration: number;
  questionsPerPage: number;
  randomizeQuestions: boolean;
  passwordMinLength: number;
  sessionTimeout: number;
  emailNotifications: boolean;
  inAppNotifications: boolean;
}

interface SettingsContentProps {
  settings: SchoolSettings;
  setSettings: React.Dispatch<React.SetStateAction<SchoolSettings>>;
  token: string | null;
}

const SettingsContent: React.FC<SettingsContentProps> = ({ settings, setSettings, token }) => {
  const [formData, setFormData] = useState<SchoolSettings>(settings);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value, 10) || 0 : value
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          logoUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Authentication token is missing');
      return;
    }

    setIsSaving(true);

    try {
      let logoUrl = formData.logoUrl;
      if (logoFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('logo', logoFile);
        const uploadResponse = await fetch('/api/upload/logo', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formDataUpload,
        });
        if (uploadResponse.ok) {
          logoUrl = (await uploadResponse.json()).url;
        } else {
          throw new Error('Failed to upload logo');
        }
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, logoUrl }),
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        toast.success('Settings updated successfully');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const SettingSection = ({ 
    title, 
    icon, 
    children 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode 
  }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center mb-4">
        <span className="text-[#66934e] mr-2">{icon}</span>
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center">
        <FaCog className="mr-2 text-[#66934e]" />
        Settings
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* School Information */}
        <SettingSection title="School Information" icon={<FaSchool size={18} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
              <input
                type="text"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-[#66934e] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-[#66934e] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-[#66934e] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-[#66934e] focus:border-transparent"
              />
              {formData.logoUrl && (
                <div className="mt-2 p-2 border rounded bg-gray-50">
                  <img 
                    src={formData.logoUrl} 
                    alt="School Logo" 
                    className="h-16 object-contain mx-auto" 
                  />
                </div>
              )}
            </div>
          </div>
        </SettingSection>

        {/* Exam Settings */}
        <SettingSection title="Exam Settings" icon={<FaBook size={18} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Exam Duration (minutes)</label>
              <input
                type="number"
                name="defaultExamDuration"
                value={formData.defaultExamDuration}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-[#66934e] focus:border-transparent"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Questions per Page</label>
              <input
                type="number"
                name="questionsPerPage"
                value={formData.questionsPerPage}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-[#66934e] focus:border-transparent"
                min="1"
                required
              />
            </div>
            <div className="flex items-center col-span-1 md:col-span-2">
              <input
                type="checkbox"
                id="randomizeQuestions"
                name="randomizeQuestions"
                checked={formData.randomizeQuestions}
                onChange={handleInputChange}
                className="h-4 w-4 text-[#66934e] focus:ring-[#66934e] rounded"
              />
              <label htmlFor="randomizeQuestions" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                Randomize Question Order
              </label>
            </div>
          </div>
        </SettingSection>

        {/* Security Settings */}
        <SettingSection title="Security Settings" icon={<FaLock size={18} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Password Length</label>
              <input
                type="number"
                name="passwordMinLength"
                value={formData.passwordMinLength}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-[#66934e] focus:border-transparent"
                min="6"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
              <input
                type="number"
                name="sessionTimeout"
                value={formData.sessionTimeout}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-[#66934e] focus:border-transparent"
                min="5"
                required
              />
            </div>
          </div>
        </SettingSection>

        {/* Notification Settings */}
        <SettingSection title="Notification Settings" icon={<FaBell size={18} />}>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                name="emailNotifications"
                checked={formData.emailNotifications}
                onChange={handleInputChange}
                className="h-4 w-4 text-[#66934e] focus:ring-[#66934e] rounded"
              />
              <label htmlFor="emailNotifications" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                Enable Email Notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="inAppNotifications"
                name="inAppNotifications"
                checked={formData.inAppNotifications}
                onChange={handleInputChange}
                className="h-4 w-4 text-[#66934e] focus:ring-[#66934e] rounded"
              />
              <label htmlFor="inAppNotifications" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                Enable In-App Notifications
              </label>
            </div>
          </div>
        </SettingSection>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className={`px-6 py-2 ${
              isSaving ? 'bg-gray-400' : 'bg-[#66934e] hover:bg-[#557a40]'
            } text-white rounded transition-colors flex items-center`}
          >
            {isSaving ? (
              <>
                <span className="animate-pulse mr-2">●</span>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsContent;