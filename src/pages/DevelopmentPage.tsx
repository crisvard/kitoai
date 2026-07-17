import React from 'react';
import WebsitePage from './WebsitePage';

interface DevelopmentPageProps {
  onBack: () => void;
}

export const DevelopmentPage: React.FC<DevelopmentPageProps> = ({ onBack }) => {
  return <WebsitePage onBack={onBack} />;
};

export default DevelopmentPage;