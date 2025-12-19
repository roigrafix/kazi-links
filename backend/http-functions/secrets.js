import { get_secrets } from '../secrets/getSecrets.js';
import { post_secrets } from '../secrets/setSecrets.js';

export async function get_api_secrets(request) {
  return get_secrets(request);
}

export async function post_api_secrets(request) {
  return post_secrets(request);
}
