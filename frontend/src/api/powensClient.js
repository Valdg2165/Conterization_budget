import axios from 'axios'

const powensClient = axios.create({
  baseURL: import.meta.env.VITE_POWENS_API_URL || 'http://localhost:3003',
})

powensClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default powensClient
