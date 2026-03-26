export async function uploadImageToImgBB(file: File, folder: string = 'products'): Promise<string> {
  // Backward-compatible name, but now uploads to our backend storage endpoint (Supabase or local)
  const formData = new FormData();
  formData.append('file', file);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  const url = `${baseUrl}/storage/upload?folder=${encodeURIComponent(folder)}`;

  // Attach Bearer token from localStorage if present
  let headers: Record<string, string> | undefined;
  if (typeof window !== 'undefined') {
    try {
      const token = window.localStorage.getItem('accessToken');
      if (token) headers = { Authorization: `Bearer ${token}` };
    } catch (_) {}
  }

  const res = await fetch(url, { method: 'POST', body: formData, headers });
  const data = await res.json();

  if (!res.ok || !data?.url) {
    throw new Error(data?.error || 'Image upload failed');
  }

  return data.url as string;
}
