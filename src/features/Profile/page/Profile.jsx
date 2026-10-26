import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaMapMarkerAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaBoxOpen,
  FaHeart,
  FaSignOutAlt
} from "react-icons/fa";
import client, { logoutSession } from "../../../lib/ApiClient";
import "../styles/user.css";
import showToast from "../../../utils/toast";

const Profile = () => {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [profile, setProfile] = useState({
    first_name: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: ""
  });

  const [addresses, setAddresses] = useState([]);

  const [addressData, setAddressData] = useState({
    full_name: "",
    phone: "",
    address_line: "",
    city: "",
    postal_code: "",
    country: "India",
    is_default: false
  });

  const [editingId, setEditingId] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const getProfile = async () => {

    try {

      setLoading(true);

      const res = await client.get("profile/");

      setProfile({
        first_name: res.data.first_name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        gender: res.data.gender || "",
        date_of_birth: res.data.date_of_birth || ""
      });

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);

    }

  };

  const handleProfileChange = (e) => {

    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });

  };

  const handleAddressChange = (e) => {

    const { name, value, type, checked } = e.target;

    setAddressData({
      ...addressData,
      [name]: type === "checkbox" ? checked : value
    });

  };

  const resetAddressForm = () => {

    setAddressData({
      full_name: "",
      phone: "",
      address_line: "",
      city: "",
      postal_code: "",
      country: "India",
      is_default: false
    });

    setEditingId(null);

  };
  const getAddresses = async () => {

    try {

      const res = await client.get("addresses/");

      setAddresses(res.data || []);

    } catch (err) {

      console.log(err);

    }

  };

  useEffect(() => {
    getProfile();
    getAddresses();
  }, []);

  const updateProfile = async (e) => {

    e.preventDefault();

    try {

      setLoading(true);

      const res = await client.put(
        "profile/",
        profile
      );

      setProfile({
        first_name: res.data.data?.first_name || profile.first_name,
        email: res.data.data?.email || profile.email,
        phone: res.data.data?.phone || profile.phone,
        gender: res.data.data?.gender || profile.gender,
        date_of_birth: res.data.data?.date_of_birth || profile.date_of_birth
      });

      setIsEditingProfile(false);
      showToast.success("Profile updated successfully")
    } catch (err) {

      console.log(err);

      
      showToast.error("Unable to update profile ")

    } finally {

      setLoading(false);

    }

  };

  const addAddress = async () => {

    try {

      await client.post(
        "addresses/",
        addressData
      );

      await getAddresses();

      resetAddressForm();

      setShowModal(false);
      showToast.success('Address added ')

    } catch (err) {

      console.log(err);


      showToast.error("Unable to add address")

    }

  };

  const editAddress = (address) => {

    setEditingId(address.id);

    setAddressData({
      full_name: address.full_name || "",
      phone: address.phone || "",
      address_line: address.address_line || "",
      city: address.city || "",
      postal_code: address.postal_code || "",
      country: address.country || "India",
      is_default: address.is_default
    });

    setShowModal(true);

  };
  const updateAddress = async () => {

    try {

      await client.put(
        `addresses/${editingId}/`,
        addressData
      );

      await getAddresses();

      resetAddressForm();

      setShowModal(false);

      showToast.success("Address updated successfully");


    } catch (err) {

      console.log(err);

      showToast.error("Unable to update address");

    }

  };

  const deleteAddress = async (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (!confirmDelete) return;

    try {

      await client.delete(
        `addresses/${id}/`
      );

      await getAddresses();

      showToast.success("Address deleted successfully");

    } catch (err) {

      console.log(err);

      showToast.error("Unable to delete address");

    }

  };

  const getDefaultAddress = () => {

    return addresses.find(
      item => item.is_default
    );

  };

  const logout = async () => {
    await logoutSession();
    navigate("/login", { replace: true });
  };
  return (

    <div className="profile-page">

      <div className="profile-wrapper">

        <div className="profile-banner">

          <div className="banner-left">

            <div className="profile-avatar">

              {profile.first_name
                ? profile.first_name.charAt(0).toUpperCase()
                : "A"}

            </div>

            <div>

              <h1>

                My Account

              </h1>

              <p>

                Welcome back,

                <strong>

                  {" "}
                  {profile.first_name || "Customer"}

                </strong>



              </p>

            </div>

          </div>

        </div>

        <div className="profile-top-grid">

          <div className="profile-card">

            <div className="card-title">

              <FaUserCircle />

              <h3>

                Personal Information

              </h3>

            </div>

            <form
              className={`profile-form ${isEditingProfile ? "is-editing" : "is-readonly"}`}
              onSubmit={updateProfile}
            >

              <div className="input-group">

                <label>

                  First Name

                </label>

                <input
                  type="text"
                  name="first_name"
                  value={profile.first_name}
                  onChange={handleProfileChange}
                  readOnly={!isEditingProfile}
                  required
                />

              </div>

              <div className="input-group">

                <label>

                  Email Address

                </label>

                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  readOnly
                />

              </div>

              <div className="input-group">

                <label>

                  Phone Number

                </label>

                <input
                  type="text"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  readOnly={!isEditingProfile}
                  required
                />

              </div>

              <div className="input-group">

                <label>

                  Gender

                </label>

                <select
                  name="gender"
                  value={profile.gender}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile}
                  required
                >

                  <option value="">

                    Select Gender

                  </option>

                  <option value="Male">

                    Male

                  </option>

                  <option value="Female">

                    Female

                  </option>

                  <option value="Other">

                    Other

                  </option>

                </select>

              </div>

              <div className="input-group full-width">

                <label>

                  Date of Birth

                </label>

                <input
                  type="date"
                  name="date_of_birth"
                  value={profile.date_of_birth}
                  onChange={handleProfileChange}
                  readOnly={!isEditingProfile}
                  required
                />

              </div>

              <button
                type={isEditingProfile ? "submit" : "button"}
                className={`save-profile-btn ${!isEditingProfile ? "edit-profile-btn" : ""}`}
                onClick={!isEditingProfile ? () => setIsEditingProfile(true) : undefined}
                disabled={loading}
              >

                {loading ?

                  "Saving..."

                  : isEditingProfile ?

                  "Save Changes"

                  :

                  <><FaEdit aria-hidden="true" /> Edit</>}

              </button>

            </form>

          </div>

          <div className="default-address-card">

    <div className="card-header">

        <div className="card-title">

            <FaMapMarkerAlt className="title-icon" />

            <div>

                <h3>Default Address</h3>

                <p>Your primary delivery address</p>

            </div>

        </div>

        {getDefaultAddress() && (
            <span className="default-badge">
                Default
            </span>
        )}

    </div>

    {getDefaultAddress() ? (

        <div className="default-address">

            <div className="address-user">

                <h4>{getDefaultAddress().full_name}</h4>

                <span>{getDefaultAddress().phone}</span>

            </div>

            <div className="address-details">

                <p>{getDefaultAddress().address_line}</p>

                <p>
                    {getDefaultAddress().city},{" "}
                    
                    {getDefaultAddress().postal_code}
                </p>

                <p>{getDefaultAddress().country}</p>

            </div>

            <button
                className="change-address-btn"
                onClick={() => editAddress(getDefaultAddress())}
            >
                <FaMapMarkerAlt />
                Change Address
            </button>

        </div>

    ) : (

        <div className="no-address">

            <FaMapMarkerAlt className="empty-icon" />

            <h4>No Default Address</h4>

            <p>
                You haven't added a default delivery
                address yet.
            </p>

            <button
                className="add-address-small"
                onClick={() => {
                    resetAddressForm();
                    setShowModal(true);
                }}
            >
                <FaPlus />
                Add New Address
            </button>

        </div>

    )}

</div>

        </div>

        <div className="address-header">

          <div className="address-title">

            <h2>Saved Addresses</h2>

            <p>Manage your delivery addresses for faster checkout.</p>

          </div>

          <button
            className="add-address-btn"
            onClick={() => {
              resetAddressForm();
              setShowModal(true);
            }}
          >

            <FaPlus />

            Add New Address

          </button>

        </div>

        <div className="address-grid">
          {addresses.length === 0 ? (
            <div className="empty-address">

              <FaMapMarkerAlt className="empty-icon" />

              <h3>

                No Addresses Found

              </h3>

              <p>

                Add your delivery address to make checkout faster.

              </p>

              <button
                className="add-first-address"
                onClick={() => {
                  resetAddressForm();
                  setShowModal(true);
                }}
              >

                <FaPlus />

                Add Address

              </button>

            </div>

          ) : (

            addresses.map(address => (

              <div
                className="address-card"
                key={address.id}
              >

                <div className="address-card-top">

                  <div>

                    <h3>

                      {address.full_name}

                    </h3>

                    <p>

                      {address.phone}

                    </p>

                  </div>

                  {address.is_default && (

                    <span className="default-badge">

                      Default

                    </span>

                  )}

                </div>

                <div className="address-body">

                  <p>

                    {address.address_line}

                  </p>

                  <p>

                    {address.city},{" "}
                    

                  </p>

                  <p>

                    {address.postal_code}

                  </p>

                  <p>

                    {address.country}

                  </p>

                </div>

                <div className="address-buttons">

                  <button
                    className="edit-address-btn"
                    onClick={() =>
                      editAddress(address)
                    }
                  >

                    <FaEdit />

                    Edit

                  </button>

                  <button
                    className="delete-address-btn"
                    onClick={() =>
                      deleteAddress(address.id)
                    }
                  >

                    <FaTrash />

                    Delete

                  </button>

                </div>

              </div>

            ))

          )}

        </div>

        {showModal && (

          <div
            className="modal-overlay"
            onClick={() => {
              setShowModal(false);
              resetAddressForm();
            }}
          >

            <div
              className="address-modal"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="modal-header">

                <h2>

                  {editingId ?

                    "Update Address"

                    :

                    "Add New Address"}

                </h2>

                <button
                  className="close-modal"
                  onClick={() => {
                    setShowModal(false);
                    resetAddressForm();
                  }}
                >

                  ×

                </button>

              </div>

              <div className="modal-form">

                <div className="modal-grid">

                  <input
                    type="text"
                    name="full_name"
                    placeholder="Full Name"
                    value={addressData.full_name}
                    onChange={handleAddressChange}
                    required
                  />

                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone Number"
                    value={addressData.phone}
                    onChange={handleAddressChange}
                    required
                  />

                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={addressData.city}
                    onChange={handleAddressChange}
                    required
                  />

                  

                  <input
                    type="text"
                    name="postal_code"
                    placeholder="Postal Code"
                    value={addressData.postal_code}
                    onChange={handleAddressChange}
                    required
                  />

                  <input
                    type="text"
                    name="country"
                    placeholder="Country"
                    value={addressData.country}
                    onChange={handleAddressChange}
                    required
                  />

                </div>

                <textarea
                  name="address_line"
                  placeholder="Street Address"
                  value={addressData.address_line}
                  onChange={handleAddressChange}
                  required
                />

                <label className="default-check">

                  <input
                    type="checkbox"
                    name="is_default"
                    checked={addressData.is_default}
                    onChange={handleAddressChange}
                    required
                  />

                  Set as Default Address

                </label>

                <div className="modal-actions">

                  <button
                    className="cancel-btn"
                    onClick={() => {
                      setShowModal(false);
                      resetAddressForm();
                    }}
                  >

                    Cancel

                  </button>

                  <button
                    className="save-btn"
                    onClick={() =>
                      editingId
                        ? updateAddress()
                        : addAddress()
                    }
                  >

                    {editingId ?

                      "Update Address"

                      :

                      "Save Address"}

                  </button>

                </div>

              </div>

            </div>

          </div>

        )}
        <div className="quick-links">

          <div className="quick-card"
            onClick={() => navigate("/myorders")}
          >

            <div className="quick-icon">

              <FaBoxOpen />

            </div>

            <div>

              <h3>

                My Orders

              </h3>

              <p>

                Track your recent orders

              </p>

            </div>

          </div>

          <div className="quick-card"
            onClick={() => navigate("/wishlist")}
          >

            <div className="quick-icon">

              <FaHeart />

            </div>

            <div>

              <h3>

                Wishlist

              </h3>

              <p>

                View your saved products

              </p>

            </div>

          </div>

          <div
            className="quick-card logout-card"
            onClick={logout}
          >

            <div className="quick-icon">

              <FaSignOutAlt />

            </div>

            <div>

              <h3>

                Logout

              </h3>

              <p>

                Sign out from your account

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};

export default Profile;
