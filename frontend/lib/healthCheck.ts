import apiClient from "./apiClient";
import { useServerErrorStore } from "@/stores/useServerErrorStore";

export async function verifyBackendHealth() {
    try {
        await apiClient.get("/health")

        console.log("BACKEND HEALTHY!")

        useServerErrorStore.getState().setServerError(false)

    } catch (error) {
        console.log("BACKEND UNHEALTHY!")

        useServerErrorStore.getState().setServerError(true)
    }
}