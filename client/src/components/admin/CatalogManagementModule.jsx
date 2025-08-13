// src/components/admin/CatalogManagementModule.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import axiosInstance from '@/utils/axios';

const CatalogManagementModule = () => {
  // === B: Catalog state ===
  const [homeTypes, setHomeTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // === C: Listings state ===
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  // === Form state for Category/Subtype ===
  const [newCategory, setNewCategory] = useState({ name: '', description: '', image: '' });
  const [newSubtype, setNewSubtype] = useState({ name: '', description: '', image: '' });
  const [selectedHomeTypeId, setSelectedHomeTypeId] = useState('');

  useEffect(() => {
    fetchCatalog();
    fetchListings();
  }, []);

  // Fetch catalog tree
  const fetchCatalog = async () => {
    try {
      const { data } = await axiosInstance.get('/listings/catalog');
      setHomeTypes(data.homeTypes || []);
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all listings
  const fetchListings = async () => {
    try {
      const { data } = await axiosInstance.get('/listings');
      setListings(data);
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setListingsLoading(false);
    }
  };

  // --- B1: Add a new HomeType (Category) ---
  const addCategory = async e => {
    e.preventDefault();
    try {
      await axiosInstance.post('/listings/hometypes', newCategory);
      setNewCategory({ name: '', description: '', image: '' });
      fetchCatalog();
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  // --- B2: Delete a HomeType ---
  const deleteCategory = async id => {
    try {
      await axiosInstance.delete(`/listings/hometypes/${id}`);
      fetchCatalog();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  // --- B3: Add a Subtype ---
  const addSubtype = async e => {
    e.preventDefault();
    if (!selectedHomeTypeId) return;
    try {
      await axiosInstance.post(
        `/listings/hometypes/${selectedHomeTypeId}/subtypes`,
        newSubtype
      );
      setNewSubtype({ name: '', description: '', image: '' });
      setSelectedHomeTypeId('');
      fetchCatalog();
    } catch (err) {
      console.error('Error adding subtype:', err);
    }
  };

  // --- B4: Delete a Subtype ---
  const deleteSubtype = async (homeTypeId, subId) => {
    try {
      await axiosInstance.delete(
        `/listings/hometypes/${homeTypeId}/subtypes/${subId}`
      );
      fetchCatalog();
    } catch (err) {
      console.error('Error deleting subtype:', err);
    }
  };

  // --- C1: Update listing.room_type BY ObjectId ---
  const updateListingRoomType = async (objectId, newRoomType) => {
    try {
      await axiosInstance.put('/listings/update', {
        id: objectId,
        room_type: newRoomType
      });
      fetchListings();
    } catch (err) {
      console.error('Error updating listing:', err);
    }
  };

  // --- C2: Delete a listing BY ObjectId ---
  const deleteListing = async objectId => {
    try {
      await axiosInstance.delete(`/listings/${objectId}`);
      fetchListings();
    } catch (err) {
      console.error('Error deleting listing:', err);
    }
  };

  if (loading) {
    return <div className="p-6">Loading catalog…</div>;
  }

  return (
    <div className="space-y-8 bg-white rounded-xl p-6 border">
      {/* === B. Catalog Management === */}
      <section className="space-y-6">
        {/* Add Category */}
        <form onSubmit={addCategory} className="space-y-2">
          <h3 className="text-xl font-semibold">Add New Category</h3>
          <input
            type="text"
            required
            value={newCategory.name}
            onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
            placeholder="Category Name"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            value={newCategory.description}
            onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
            placeholder="Description"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            value={newCategory.image}
            onChange={e => setNewCategory({ ...newCategory, image: e.target.value })}
            placeholder="Image URL"
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </form>

        {/* Add Subtype */}
        <form onSubmit={addSubtype} className="space-y-2">
          <h3 className="text-xl font-semibold">Add New Subtype</h3>
          <select
            className="w-full p-2 border rounded"
            value={selectedHomeTypeId}
            onChange={e => setSelectedHomeTypeId(e.target.value)}
          >
            <option key="default" value="">
              — Select Category —
            </option>
            {homeTypes.map(ht => (
              <option key={ht._id} value={ht._id}>
                {ht.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            required
            value={newSubtype.name}
            onChange={e => setNewSubtype({ ...newSubtype, name: e.target.value })}
            placeholder="Subtype Name"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            value={newSubtype.description}
            onChange={e => setNewSubtype({ ...newSubtype, description: e.target.value })}
            placeholder="Description"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            value={newSubtype.image}
            onChange={e => setNewSubtype({ ...newSubtype, image: e.target.value })}
            placeholder="Image URL"
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            <Plus className="w-4 h-4" /> Add Subtype
          </button>
        </form>

        {/* Catalog Tree */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Catalog Tree</h3>
          {homeTypes.map(ht => (
            <div key={ht._id} className="mb-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center mb-2">
                <strong>{ht.name}</strong>
                <button onClick={() => deleteCategory(ht._id)} className="text-red-600 hover:text-red-800">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2">{ht.description}</p>
              {ht.subtypes?.length > 0 && (
                <ul className="ml-6 space-y-1">
                  {ht.subtypes.map(st => (
                    <li key={st._id} className="flex justify-between items-center p-2 bg-white rounded">
                      <span>{st.name}</span>
                      <button onClick={() => deleteSubtype(ht._id, st._id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* === C. Listings Management === */}
      <section>
        <h3 className="text-xl font-semibold mb-2">Listings Management</h3>

        {listingsLoading ? (
          <p>Loading listings…</p>
        ) : listings.length === 0 ? (
          <p className="text-gray-500">No listings found.</p>
        ) : (
          listings.map(listing => (
            <div key={listing._id} className="mb-4 p-4 bg-gray-50 rounded-lg border flex justify-between items-center">
              <div>
                <h4 className="font-medium">{listing.title}</h4>
                <p className="text-sm text-gray-600">
                  Current Type: <strong>{listing.room_type}</strong>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={listing.room_type || ''}
                  onChange={e => updateListingRoomType(listing._id, e.target.value)}
                  className="p-2 border rounded"
                >
                  <option key="default" value="">
                    -- Select Type --
                  </option>
                  {homeTypes
                    .flatMap(ht => [
                      { name: ht.name, value: ht.name },
                      ...(ht.subtypes || []).map(st => ({ name: st.name, value: st.name }))
                    ])
                    .map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.name}
                      </option>
                    ))}
                </select>
                <button onClick={() => deleteListing(listing._id)} className="text-red-600 hover:text-red-800">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default CatalogManagementModule;
