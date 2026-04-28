document.addEventListener('DOMContentLoaded', () => {
    const voucherInput = document.getElementById('voucherCode');
    const redeemBtn = document.getElementById('redeemBtn');
    const successArea = document.getElementById('successArea');
    const inputArea = document.getElementById('inputArea');
    const displayCode = document.getElementById('displayCode');

    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');

    if (codeFromUrl) {
        voucherInput.value = codeFromUrl.toUpperCase();
        validateAndRedeem(codeFromUrl);
    }

    // Input monitoring
    voucherInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        redeemBtn.disabled = val.length < 5;
    });

    // Redemption logic
    redeemBtn.addEventListener('click', () => {
        const code = voucherInput.value.trim();
        validateAndRedeem(code);
    });

    function validateAndRedeem(code) {
        if (!code) return;

        // Visual feedback
        redeemBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Verifying...';
        redeemBtn.disabled = true;

        // Simulate network delay
        setTimeout(() => {
            inputArea.style.display = 'none';
            successArea.style.display = 'block';
            displayCode.textContent = code.toUpperCase();
            
            // Confetti effect or similar could be added here
            console.log('Voucher redeemed:', code);
        }, 1500);
    }
});
