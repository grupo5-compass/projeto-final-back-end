const apiUrl = process.env.FINANCIAL_INSTITUTION_API_URL_1;
const apiKey = process.env.FINANCIAL_INSTITUTION_API_KEY_1;
const timeout = parseInt(process.env.FINANCIAL_INSTITUTION_TIMEOUT_1) || 5000;

export async function fetchWithTimeout(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(`${apiUrl}${endpoint}`, {
            ...options,
            headers: {
                "x-api-key": apiKey,
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(
                `Erro na API externa: ${response.status} - ${response.statusText}`
            );
        }

        return response.json();
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error(`Timeout na requisição (${timeout}ms)`);
        }
        throw error;
    }
}

export const OpenFinanceAPI = { apiUrl, apiKey, timeout };
