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

