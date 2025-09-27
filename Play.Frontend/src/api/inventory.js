// API service for Play.Inventory
// Update BASE_URL to your Play.Inventory backend URL
const BASE_URL = 'https://localhost:5005';

// Get inventory items for a user
export async function getInventoryItems(userId)
{
    const response = await fetch(`${BASE_URL}/items?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch inventory items');
    return response.json();
}

// Grant inventory items to a user
export async function createInventoryItem(item)
{
    const response = await fetch(`${BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed to create inventory item');
    // Handle empty response body
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}
