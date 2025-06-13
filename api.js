class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        this.maxRetries = 3;
        this.isServerHealthy = null;
    }

    async checkServerAvailability() {
        try {
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                headers: this.headers,
                timeout: 5000 // 5 second timeout
            });
            
            if (!response.ok) {
                throw new Error('Server health check failed');
            }
            
            const result = await response.json();
            return result.status === 'ok';
        } catch (error) {
            throw new Error(`Server is not available. Please ensure:
1. The server is started (run 'npm start')
2. Server is running on port 3001
3. Your internet connection is active
4. No firewall is blocking the connection

Error details: ${error.message}`);
        }
    }

    async request(endpoint, method = 'GET', data = null, retryCount = 0) {
        try {
            // Check server availability before making any request
            await this.checkServerAvailability();

            const config = {
                method,
                headers: this.headers
            };

            if (data) {
                config.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            const text = await response.text();
            
            let result;
            try {
                result = text ? JSON.parse(text) : {};
            } catch (e) {
                console.error('Failed to parse response:', text);
                throw new Error('Invalid response format from server');
            }

            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }

            return result;
        } catch (error) {
            if (error.message.includes('Server is not available')) {
                throw error; // Don't retry if server is not available
            }
            
            if (retryCount < this.maxRetries) {
                console.log(`Request failed, retrying (${retryCount + 1}/${this.maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.request(endpoint, method, data, retryCount + 1);
            }
            throw error;
        }
    }

    // Auth endpoints
    async login(email, password) {
        return this.request('/auth/login', 'POST', { email, password });
    }

    async signup(fullName, email, password) {
        return this.request('/auth/signup', 'POST', { fullName, email, password });
    }

    async requestPasswordReset(email) {
        return this.request('/auth/request-otp', 'POST', { email });
    }

    async verifyOTP(email, otp) {
        return this.request('/auth/verify-otp', 'POST', { email, otp });
    }

    async resetPassword(email, otp, newPassword) {
        return this.request('/auth/reset-password', 'POST', { email, otp, newPassword });
    }

    // Health check
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                headers: this.headers
            });
            
            if (!response.ok) {
                this.isServerHealthy = false;
                throw new Error('Server health check failed');
            }
            
            const result = await response.json();
            this.isServerHealthy = result.status === 'ok';
            return this.isServerHealthy;
        } catch (error) {
            this.isServerHealthy = false;
            throw new Error('Server is not available');
        }
    }
}

// Create a single instance to be used across the application
const api = new ApiService(); 