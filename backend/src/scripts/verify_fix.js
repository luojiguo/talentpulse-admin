const BASE_URL = 'http://127.0.0.1:3001/api';

async function verifyFix() {
    const email = `test_verify_${Date.now()}@example.com`;
    const password = 'password123';

    try {
        console.log(`1. Registering new candidate: ${email}`);

        const regResponse = await fetch(`${BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                name: 'Test Candidate',
                phone: `138${Date.now().toString().slice(-8)}`,
                userType: 'candidate'
            })
        });

        console.log('Registration Status:', regResponse.status);
        if (!regResponse.ok) {
            const errText = await regResponse.text();
            console.error('Registration failed:', errText);
            return;
        }

        const registerData = await regResponse.json();
        const userId = registerData.data.id;
        console.log('Registration successful, User ID:', userId);

        console.log('2. Logging in to get token...');
        const loginResponse = await fetch(`${BASE_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: email,
                password,
                userType: 'candidate'
            })
        });

        if (!loginResponse.ok) {
            console.error('Login failed:', await loginResponse.text());
            return;
        }

        const loginData = await loginResponse.json();
        const authToken = loginData.token;

        if (!authToken) {
            console.error('Login failed to return token');
            return;
        }

        console.log('Login successful. Token received.');

        console.log('3. Verifying Candidates table record (via /api/candidates/:userId)...');

        try {
            const profileResponse = await fetch(`${BASE_URL}/candidates/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            console.log('Profile Fetch Status:', profileResponse.status);

            if (profileResponse.ok) {
                const profileResult = await profileResponse.json();
                console.log('Profile Data present:', !!profileResult.data);

                if (profileResult.data && profileResult.data.user_id == userId) {
                    console.log('SUCCESS: Candidate profile retrieved and matches user ID. The `candidates` record exists.');
                } else {
                    console.log('WARNING: Profile endpoint returned success but data is null or mismatch.');
                    console.log('Response:', JSON.stringify(profileResult, null, 2));
                }
            } else {
                const errText = await profileResponse.text();
                console.log('WARNING: Profile endpoint returned error:', errText);
            }
        } catch (err) {
            console.error('Profile fetch failed:', err.message);
        }

    } catch (error) {
        console.error('Verification failed:', error.message);
    }
}

verifyFix();
