// API service for Play.Catalog
// Update BASE_URL to your Play.Catalog backend URL
const BASE_URL = 'http://localhost:5001';

export async function getCatalogItems()
{
    const response = await fetch(`${BASE_URL}/items`);
    if (!response.ok) throw new Error('Failed to fetch catalog items');
    return response.json();
}

export async function createCatalogItem(item)
{
    const response = await fetch(`${BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed to create catalog item');
    return response.json();
}

export async function updateCatalogItem(id, item)
{
    const response = await fetch(`${BASE_URL}/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed to update catalog item');
    // Handle empty response body
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

export async function deleteCatalogItem(id)
{
    const response = await fetch(`${BASE_URL}/items/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete catalog item');
    // Handle empty response body
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}
