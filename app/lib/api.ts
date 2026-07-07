// app/lib/api.ts
import { apiRequest } from './apiClient';

export async function fetchClientNames() {
  const result = await apiRequest({
    type: 'getClientList'
  });
  return result.response_data;
}

export async function addClient(formData: any) {
  const result = await apiRequest({
    type: 'createClient',
    data: formData
  });
  return result;
}

export async function fetchAreas() {
  const result = await apiRequest({
    type: 'getAreas'
  });
  return result.response_data;
}

export async function fetchCities() {
  const result = await apiRequest({
    type: 'getCities'
  });
  return result.response_data;
}

export async function fetchActiveClientsGrouped() {
  const result = await apiRequest({
    type: 'getActiveClientsGrouped'
  });
  return result.response_data;
}

export async function fetchProductPrices(clientType: string, clientName: string) {
  const result = await apiRequest({
    type: 'getProductPrices',
    clientType,
    clientName
  });
  return result;
}

export async function saveProductPrices(clientType: string, clientName: string, prices: Record<string, number | string>) {
  const result = await apiRequest({
    type: 'saveProductPrices',
    clientType,
    clientName,
    prices
  });
  return result;
}

export async function fetchAllProductPrices(clientType: string) {
  const result = await apiRequest({
    type: 'getAllPricingData',
    clientType
  });
  return result;
}

export async function fetchClientCategories() {
  const result = await apiRequest({
    type: 'getClientCategories'
  });
  return result.response_data;
}

export async function fetchClientDetails(partyName: string) {
  const result = await apiRequest({
    type: 'getClientDetails',
    partyName
  });
  return result;
}

export async function updateClientDetails(originalPartyName: string, formData: any) {
  const result = await apiRequest({
    type: 'updateClient',
    originalPartyName,
    data: formData
  });
  return result;
}

