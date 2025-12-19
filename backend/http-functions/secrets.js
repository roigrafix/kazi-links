import { get_secrets } from '../secrets/getSecrets.js';
import { post_secrets } from '../secrets/setSecrets.js';

export async function get_api_secrets(request) {
  return get_secrets(request);
}

export async function post_api_secrets(request) {
  return post_secrets(request);
}
```

### Step 4: Use in Frontend

The `secretsService` is already integrated and ready to use:

```typescript
import { secretsService } from '@/services/secretsService';

// Initialize at app startup
await secretsService.initialize();

// Get a specific credential
const accountSid = secretsService.getCredential('twilioAccountSid');

// Check if configured
if (secretsService.isTwilioConfigured()) {
  // Use Twilio
}

// Refresh credentials
await secretsService.refresh();
