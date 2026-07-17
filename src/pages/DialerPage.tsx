import React from 'react';
import TelemarketingDesk from '../components/dialer/TelemarketingDesk';

interface DialerPageProps {
  onBack: () => void;
}

const DialerPage: React.FC<DialerPageProps> = ({ onBack }) => {
  return <TelemarketingDesk onBack={onBack} />;
};

export default DialerPage;
