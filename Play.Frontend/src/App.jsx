import { useState, useEffect } from 'react'
import { getCatalogItems, createCatalogItem, updateCatalogItem, deleteCatalogItem } from './api/catalog'
import { getInventoryItems, createInventoryItem } from './api/inventory'
import './App.css'

function getInitialTab()
{
  // Check for tab in localStorage or hash, fallback to 'catalog'
  if (window.location.hash === '#inventory') return 'inventory';
  if (window.location.hash === '#catalog') return 'catalog';
  return localStorage.getItem('activeTab') || 'catalog';
}

function App()
{
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [catalog, setCatalog] = useState([])
  const [inventory, setInventory] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [catalogForm, setCatalogForm] = useState({ name: '', description: '', price: '' })
  const [inventoryForm, setInventoryForm] = useState({ catalogItemId: '', quantity: 0 })
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [editCatalogItem, setEditCatalogItem] = useState(null)
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const [editInventoryItem, setEditInventoryItem] = useState(null)
  const [userId, setUserId] = useState('');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantItem, setGrantItem] = useState(null);
  const [grantForm, setGrantForm] = useState({ userId: '', quantity: 1 });

  useEffect(() =>
  {
    // Save tab to localStorage and update hash
    localStorage.setItem('activeTab', activeTab);
    window.location.hash = `#${activeTab}`;
    if (activeTab === 'catalog') fetchCatalog();
    if (activeTab === 'inventory') fetchInventory();
  }, [activeTab])

  // Catalog CRUD
  const fetchCatalog = async () =>
  {
    setLoading(true)
    setError('')
    try
    {
      const items = await getCatalogItems()
      setCatalog(items)
    } catch (err)
    {
      setError('Catalog: ' + err.message)
    } finally
    {
      setLoading(false)
    }
  }
  const handleCatalogFormChange = e => setCatalogForm({ ...catalogForm, [e.target.name]: e.target.value })
  const handleDeleteCatalog = async id =>
  {
    setLoading(true)
    setError('')
    try
    {
      await deleteCatalogItem(id)
      await fetchCatalog()
    } catch (err)
    {
      setError('Catalog: ' + err.message)
    } finally
    {
      setLoading(false)
    }
  }
  const openCatalogModal = (item = null) =>
  {
    setEditCatalogItem(item)
    setCatalogForm(item ? { name: item.name, description: item.description, price: item.price ?? '' } : { name: '', description: '', price: '' })
    setShowCatalogModal(true)
  }
  const closeCatalogModal = () =>
  {
    setShowCatalogModal(false)
    setEditCatalogItem(null)
  }
  const handleCatalogModalSubmit = async e =>
  {
    e.preventDefault()
    setLoading(true)
    setError('')
    try
    {
      if (editCatalogItem)
      {
        await updateCatalogItem(editCatalogItem.id, { ...catalogForm, price: Number(catalogForm.price) })
      } else
      {
        await createCatalogItem({ ...catalogForm, price: Number(catalogForm.price) })
      }
      closeCatalogModal()
      await fetchCatalog()
    } catch (err)
    {
      setError('Catalog: ' + err.message)
    } finally
    {
      setLoading(false)
    }
  }

  const openGrantModal = (item) =>
  {
    setGrantItem(item);
    setGrantForm({ userId: '', quantity: 1 });
    setShowGrantModal(true);
  };
  const closeGrantModal = () =>
  {
    setShowGrantModal(false);
    setGrantItem(null);
  };
  const handleGrantFormChange = e => setGrantForm({ ...grantForm, [e.target.name]: e.target.value });
  const handleGrantSubmit = async e =>
  {
    e.preventDefault();
    setLoading(true);
    setError('');
    try
    {
      if (!grantForm.userId) throw new Error('User ID is required');
      if (!grantForm.quantity || isNaN(grantForm.quantity) || grantForm.quantity <= 0) throw new Error('Quantity must be a positive number');
      await createInventoryItem({
        userId: grantForm.userId,
        catalogItemId: grantItem.id,
        quantity: Number(grantForm.quantity)
      });
      closeGrantModal();
    } catch (err)
    {
      setError('Grant: ' + err.message);
    } finally
    {
      setLoading(false);
    }
  };

  // Inventory CRUD
  const fetchInventory = async () =>
  {
    setLoading(true)
    setError('')
    try
    {
      if (!userId)
      {
        setInventory([]);
        setLoading(false);
        return;
      }
      const items = await getInventoryItems(userId)
      setInventory(items)
    } catch (err)
    {
      setError('Inventory: ' + err.message)
    } finally
    {
      setLoading(false)
    }
  }

  const handleInventoryFormChange = e => setInventoryForm({ ...inventoryForm, [e.target.name]: e.target.value })

  const closeInventoryModal = () =>
  {
    setShowInventoryModal(false)
    setEditInventoryItem(null)
  }

  const renderCatalogTable = () => (
    <table className="simple-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Price</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {catalog.map(item => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.description}</td>
            <td>{item.price ?? ''}</td>
            <td>
              <button className="simple-btn" onClick={() => openCatalogModal(item)}>Edit</button>
              <button className="simple-btn simple-secondary" onClick={() => openGrantModal(item)} style={{ margin: '0 0.5rem' }}>Grant</button>
              <button className="simple-btn simple-danger" onClick={() => handleDeleteCatalog(item.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const renderInventoryTable = () => (
    <table className="simple-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Quantity</th>
        </tr>
      </thead>
      <tbody>
        {inventory.map(item => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.description}</td>
            <td>{item.quantity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <div className="simple-app">
      <nav className="simple-navbar">
        <button className={activeTab === 'catalog' ? 'active' : ''} onClick={() => setActiveTab('catalog')}>Catalog</button>
        <button className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>Inventory</button>
      </nav>
      <main className="simple-main">
        {loading && <p>Loading...</p>}
        {error && <p className="simple-error">{error}</p>}
        {activeTab === 'catalog' && (
          <section>
            <h2>Catalog</h2>
            {renderCatalogTable()}
            <button className="simple-btn simple-add" onClick={() => openCatalogModal()}>Add Item</button>
          </section>
        )}
        {activeTab === 'inventory' && (
          <section>
            <h2>Inventory</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label>User ID: <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="Enter user id..." style={{ width: '350px' }} /></label>
              <button className="simple-btn" style={{ marginLeft: '1rem' }} onClick={fetchInventory} disabled={loading || !userId}>Load Inventory</button>
            </div>
            {renderInventoryTable()}
            <button className="simple-btn simple-add" onClick={() => setShowInventoryModal(true)} disabled={!userId}>Add Item</button>
          </section>
        )}
      </main>
      {/* Catalog Modal */}
      {showCatalogModal && (
        <div className="simple-modal-overlay">
          <div className="simple-modal">
            <div className="simple-modal-header">
              <span>{editCatalogItem ? 'Edit Item' : 'Add Item'}</span>
              <button className="simple-modal-close" onClick={closeCatalogModal}>&times;</button>
            </div>
            <form onSubmit={handleCatalogModalSubmit} className="simple-modal-form">
              <label>Name:<input name="name" value={catalogForm.name} onChange={handleCatalogFormChange} required /></label>
              <label>Description:<input name="description" value={catalogForm.description} onChange={handleCatalogFormChange} required /></label>
              <label>Price:<input name="price" type="number" value={catalogForm.price} onChange={handleCatalogFormChange} required /></label>
              <button type="submit" className="simple-btn simple-save">Save</button>
            </form>
          </div>
        </div>
      )}
      {/* Inventory Modal */}
      {showInventoryModal && (
        <div className="simple-modal-overlay">
          <div className="simple-modal">
            <div className="simple-modal-header">
              <span>Add Item</span>
              <button className="simple-modal-close" onClick={closeInventoryModal}>&times;</button>
            </div>
            <form onSubmit={async e =>
            {
              e.preventDefault();
              setLoading(true);
              setError('');
              try
              {
                if (!userId) throw new Error('User ID is required');
                if (!inventoryForm.catalogItemId) throw new Error('Catalog item is required');
                await createInventoryItem({
                  userId,
                  catalogItemId: inventoryForm.catalogItemId,
                  quantity: Number(inventoryForm.quantity)
                });
                closeInventoryModal();
                await fetchInventory();
              } catch (err)
              {
                setError('Inventory: ' + err.message);
              } finally
              {
                setLoading(false);
              }
            }} className="simple-modal-form">
              <label>Catalog Item:
                <select name="catalogItemId" value={inventoryForm.catalogItemId || ''} onChange={e => setInventoryForm({ ...inventoryForm, catalogItemId: e.target.value })} required>
                  <option value="" disabled>Select item...</option>
                  {catalog.map(item => (
                    <option key={item.id || item._id} value={item.id || item._id}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label>Quantity:<input name="quantity" type="number" value={inventoryForm.quantity} onChange={handleInventoryFormChange} required /></label>
              <button type="submit" className="simple-btn simple-save">Save</button>
            </form>
          </div>
        </div>
      )}
      {/* Grant Modal */}
      {showGrantModal && (
        <div className="simple-modal-overlay">
          <div className="simple-modal">
            <div className="simple-modal-header">
              <span>Grant Item: {grantItem?.name}</span>
              <button className="simple-modal-close" onClick={closeGrantModal}>&times;</button>
            </div>
            <form onSubmit={handleGrantSubmit} className="simple-modal-form">
              <label>User ID:<input name="userId" value={grantForm.userId} onChange={handleGrantFormChange} required /></label>
              <label>Quantity:<input name="quantity" type="number" min="1" value={grantForm.quantity} onChange={handleGrantFormChange} required /></label>
              <button type="submit" className="simple-btn simple-save">Grant</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
