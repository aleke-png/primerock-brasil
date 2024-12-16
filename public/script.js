const form = document.getElementById('form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    const response = await fetch('/send-data', {
        method: 'POST',
        body: formData,
    });

    const result = await response.json();
    alert(result.message);
});
