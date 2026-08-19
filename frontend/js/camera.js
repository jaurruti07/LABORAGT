const Camera = {
  async capture() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'user';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          reject(new Error('No se seleccionó ninguna imagen'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Error al leer la imagen'));
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }
};
