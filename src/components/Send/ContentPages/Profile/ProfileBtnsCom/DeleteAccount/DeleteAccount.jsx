import React, { useState } from 'react';
import { useAuthContext } from '../../../../../../../Providers/ClientProvider/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { deleteUser } from 'aws-amplify/auth';
import { DataStore } from 'aws-amplify/datastore';
import { User } from '../../../../../../models';
import { list, remove } from 'aws-amplify/storage';
import './DeleteAccount.css';

const DeleteAccount = () => {
  const { dbUser, sub } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Function to delete files from a single folder in S3
  const deleteProfilePhotos = async (sub) => {
    const folderPath = `public/profilePhoto/${sub}/`;
    try {
      let nextToken;
      do {
        const result = await list({
          path: folderPath,
          options: { listAll: true, nextToken },
        });

        if (result?.items?.length) {
          await Promise.all(
            result.items.map(async (file) => {
              if (file.path) {
                await remove({ path: file.path });
                console.log(`Deleted: ${file.path}`);
              }
            })
          );
        }

        nextToken = result.nextToken; // Update pagination token
      } while (nextToken);

      alert('All profile photos have been deleted successfully.');
    } catch (error) {
      console.error('Error deleting profile photos:', error);
      alert('Failed to delete profile photos. Please try again.');
    }
  };

  // Function to handle account deletion
  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      // 1. Delete associated user data from DataStore
      if (dbUser) {
        await DataStore.delete(User, (user) => user.id.eq(dbUser.id));
      }

      // 2. Delete user's profile photos from S3
      await deleteProfilePhotos(sub);

      // 3. Delete the user from Cognito
      await deleteUser();

      alert('Account has been successfully deleted');

      // 4. Redirect to login or home screen
      navigate('/');
    } catch (error) {
      console.log('Error deleting account:', error);
      alert('Failed to delete the account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteAccount = () => {
    const confirmation = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (confirmation) {
      handleDeleteAccount();
    }
  };

  return (
    <div className="deleteAccContainer">
      <h1 className="title">Delete Account</h1>

      <div className="body">
        <p className="txt">
          We understand that making the decision to delete your account can be difficult. If you no longer wish to use our services, you can permanently delete your account. Please note that once this action is taken, it cannot be undone.
        </p>

        {/* Key Information */}
        <h2 className="subHeader">Key Information</h2>
        <div className="txtNum">
          <h3 className="subHeaderTxt">1. Irreversible Action:</h3>
          <p className="txt">
            Deleting your account will permanently erase all your personal data, activity history, and associated details from our system.
          </p>
        </div>

        <div className="txtNum">
          <h3 className="subHeaderTxt">2. Fresh Account Option:</h3>
          <p className="txt">
            If you wish to return in the future, you will need to create a new account, as recovery of a deleted account is not possible.
          </p>
        </div>

        <div className="txtNum">
          <h3 className="subHeaderTxt">3. Associated Data</h3>
          <p className="txt">
            Any data linked to your account, such as saved preferences or past interactions, will also be deleted during this process.
          </p>
        </div>

        {/* Important Steps */}
        <h2 className="subHeader">Important Steps</h2>

        <div className="txtBulletRow">
          <span className="pointer">•</span>
          <p className="txt">
            To delete your account, tap the "Delete Account" button below.
          </p>
        </div>

        <div className="txtBulletRow">
          <span className="pointer">•</span>
          <p className="txt">
            You will be asked to confirm your decision to prevent accidental deletions.
          </p>
        </div>

        <div className="txtBulletRow">
          <span className="pointer">•</span>
          <p className="txt">
            If confirmed, your account and all related data will be permanently removed.
          </p>
        </div>

        {/* Additional Reminder */}
        <div className="lastSection">
          <h2 className="subHeader">Additional Reminder</h2>
          <p className="txt">
            If you are experiencing an issue with your account or require assistance, consider reaching out to our support team before proceeding with deletion.
          </p>
        </div>
      </div>

      {/* Delete Button */}
      <button
        className="deltBtn"
        onClick={confirmDeleteAccount}
        disabled={loading}
      >
        <p className='deltTxt'>
            {loading ? 'Deleting...' : 'Delete Account'}
        </p>
      </button>
    </div>
  );
};

export default DeleteAccount;