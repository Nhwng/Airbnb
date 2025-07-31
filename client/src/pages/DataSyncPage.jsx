import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/utils/axios';
import { toast } from 'react-toastify';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '../../hooks';

const DataSyncPage = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSyncData = async () => {
    if (!auth.user) {
      toast.error('Unauthorized: Only hosts can sync data');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/listings/sync-data');
      setMessage(response.data.message);
      toast.success('Data sync completed successfully');
    } catch (err) {
      setMessage('Error syncing data');
      toast.error('Failed to sync data');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="mt-4 flex grow items-center justify-center p-4">
      <div className="mb-40 text-center">
        <h1 className="mb-4 text-4xl">Data Synchronization</h1>
        <p className="mb-4">This page allows hosts to manually sync Airbnb data.</p>
        <button
          className="primary my-4"
          onClick={handleSyncData}
          disabled={loading}
        >
          {loading ? <Spinner /> : 'Sync Data Manually'}
        </button>
        {message && <p className="mt-4 text-lg">{message}</p>}
      </div>
    </div>
  );
};

export default DataSyncPage;