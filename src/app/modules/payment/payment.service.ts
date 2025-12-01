const successPayment = async (query: Record<string, string>) => {
    // 1.update payment status to SUCCESS
    // 2.update event participant status to CONFIRMED
    // 3.return success true
    // 4. distribute the income in admin and host 90% 10%
    return { success: true };

};
const failPayment = async (query: Record<string, string>) => {
    // 1.update payment status to FAILED delete payment record
    // 2.update event participant status to LEFT delete participant record
    // 3. update event capacity +1
    // 4. if event status is full change to OPEN
    // 3.return success true
    return { success: true };
}
const cancelPayment = async (query: Record<string, string>) => {
    // 1.update payment status to FAILED delete payment record
    // 2.update event participant status to LEFT delete participant record
    // 3. update event capacity +1
    // 4. if event status is full change to OPEN
    // 3.return success true
    return { success: true };
};
export const paymentServices = {
    successPayment,
    failPayment,
    cancelPayment,
}