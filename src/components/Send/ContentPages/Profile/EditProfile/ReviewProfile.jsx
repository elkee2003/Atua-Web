import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdCancel } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5"; 
import { useProfileContext } from '../../../../../../Providers/ClientProvider/ProfileProvider';
import { useAuthContext } from '../../../../../../Providers/ClientProvider/AuthProvider';
import { DataStore } from 'aws-amplify/datastore';
import { User } from '../../../../../models';
import { uploadData, remove } from 'aws-amplify/storage';
import "./Styles.css"; 

const ReviewDetails = () => {
  const navigate = useNavigate();

  const { firstName, lastName, username, profilePic, setProfilePic, address, phoneNumber } = useProfileContext();

  const { dbUser, setDbUser, sub, userMail } = useAuthContext();

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Function to manipulate the image using canvas
  const manipulateImage = async (imageUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = imageUrl;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const targetWidth = 600;
        const scale = targetWidth / img.width;
        canvas.width = targetWidth;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/jpeg",
          0.7 // Compression quality
        );
      };

      img.onerror = (error) => {
        reject(error);
      };
    });
  };

  // Function to upload image
  async function uploadImage() {
    try {
      if (dbUser?.profilePic) {
        await remove({ path: dbUser.profilePic });
      }

      const manipulatedBlob = await manipulateImage(profilePic);
      const fileKey = `public/profilePhoto/${sub}/${crypto.randomUUID()}.jpg`;

      const result = await uploadData({
        path: fileKey,
        data: manipulatedBlob,
        options: {
          contentType: "image/jpeg",
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (totalBytes) {
              const progress = Math.round((transferredBytes / totalBytes) * 100);
              setUploadProgress(progress);
            }
          },
        },
      }).result;

      return result.path;
    } catch (err) {
      console.error("Error uploading file:", err);
    }
  }

  const deleteProfilePic = async () => {
    if (!dbUser?.profilePic) return;

    setUploading(true);
    try {
      await remove({ path: dbUser.profilePic });
      const updatedUser = await DataStore.save(
        User.copyOf(dbUser, (updated) => {
          updated.profilePic = null;
        })
      );

      setDbUser(updatedUser);
      alert("Profile Picture Removed");
      setProfilePic(null);
    } catch (error) {
      alert("Error removing profile picture");
      console.error("Error removing profile picture:", error);
    } finally {
      setUploading(false);
    }
  };

  const createUser = async () => {
    if (uploading) return;
    setUploading(true);

    try {
      const uploadedImagePath = await uploadImage();
      const user = await DataStore.save(
        new User({
          profilePic: uploadedImagePath,
          firstName,
          lastName,
          email: userMail,
          username,
          address,
          phoneNumber,
          sub,
        })
      );
      setDbUser(user);
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  };

  const updateUser = async () => {
    if (uploading) return;
    setUploading(true);

    try {
      const uploadedImagePath = await uploadImage();
      const user = await DataStore.save(
        User.copyOf(dbUser, (updated) => {
          updated.firstName = firstName;
          updated.lastName = lastName;
          updated.username = username;
          updated.email = userMail;
          updated.profilePic = uploadedImagePath;
          updated.address = address;
          updated.phoneNumber = phoneNumber;
        })
      );
      setDbUser(user);
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (dbUser) {
      await updateUser();
      navigate("/clientcontent/profile"); 
      setTimeout(() => {
        navigate('/clientcontent/home');
      }, 1000);
    } else {
      await createUser();
      navigate("/clientcontent/profile");
      setTimeout(() => {
        navigate('/clientcontent/home');
      }, 1000);
    }
  };

  return (
    <div className='reviewProContainer'>
      <h1 className='title'>Review Profile</h1>

      <button onClick={() => window.history.back()} className='bckBtnCon'>
        <IoArrowBack className='bckBtnIcon' />
      </button>

      <div className='scrollContainer'>
        {profilePic && (
          <div className="profilePicContainerFull">
            <div className='profilePicContainer'>
              <img src={profilePic} alt="Profile" className='img' />
            </div>
            <button
              className='removeButtonContainer'
              disabled={uploading}
              onClick={deleteProfilePic}
            >
              <MdCancel className='removebtn' />
            </button>
          </div>
        )}

        <p className='subHeader'>First Name:</p>
        <p className='inputReview'>{firstName?.trim()}</p>

        <p className='subHeader'>Last Name:</p>
        <p className='inputReview'>{lastName?.trim()}</p>

        <p className='subHeader'>Username:</p>
        <p className='inputReview'>@{username?.trim()}</p>

        <p className='subHeader'>Address:</p>
        <p className='inputReview'>{address?.trim()}</p>

        <p className='subHeader'>Phone Number:</p>
        <p className='inputReviewLast'>{phoneNumber}</p>
      </div>

      <button className='saveBtn' disabled={uploading} onClick={handleSave}>
        <p className="saveBtnTxt">
          {uploading ? `Saving... ${uploadProgress}%` : "Save"}
        </p>
      </button>
    </div>
  );
};

export default ReviewDetails;