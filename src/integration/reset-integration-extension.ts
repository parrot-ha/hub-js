export interface ResetIntegrationExtension {
    reset(): Promise<boolean>;
    getResetWarning(): string;
}