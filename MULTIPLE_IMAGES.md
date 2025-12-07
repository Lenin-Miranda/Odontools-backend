# 🖼️ Sistema de Múltiples Imágenes para Productos

## Modelo de Datos

```javascript
{
  name: "Producto X",
  description: "...",
  price: 100,
  image: "http://localhost:3001/uploads/main-image.jpg",  // Imagen principal
  images: [                                                 // Galería adicional
    "http://localhost:3001/uploads/image-1.jpg",
    "http://localhost:3001/uploads/image-2.jpg",
    "http://localhost:3001/uploads/image-3.jpg",
    "http://localhost:3001/uploads/image-4.jpg"
  ]
}
```

## Endpoints

### 1. Crear Producto con Múltiples Imágenes

**POST** `/api/products`

**Headers:**

```
Authorization: Cookie (automático)
Content-Type: multipart/form-data
```

**Form Data:**

```javascript
const formData = new FormData();

// Datos del producto
formData.append("name", "Producto Ejemplo");
formData.append("description", "Descripción del producto");
formData.append("price", 100);
formData.append("stock", 50);
formData.append("category", "Categoría X");

// ⭐ Imagen principal (obligatoria)
formData.append("image", imageFile1);

// 📸 Imágenes adicionales (hasta 4, opcional)
formData.append("images", imageFile2);
formData.append("images", imageFile3);
formData.append("images", imageFile4);
```

**Ejemplo completo:**

```javascript
const createProduct = async (productData, mainImage, additionalImages = []) => {
  const formData = new FormData();

  // Agregar datos del producto
  Object.keys(productData).forEach((key) => {
    formData.append(key, productData[key]);
  });

  // Imagen principal (obligatoria)
  formData.append("image", mainImage);

  // Imágenes adicionales (opcional, máximo 4)
  additionalImages.forEach((image) => {
    formData.append("images", image);
  });

  const response = await fetch("http://localhost:3001/api/products", {
    method: "POST",
    credentials: "include",
    body: formData,
    // ⚠️ NO incluir Content-Type, FormData lo maneja automáticamente
  });

  return await response.json();
};
```

**Respuesta:**

```json
{
  "success": true,
  "product": {
    "_id": "123...",
    "name": "Producto Ejemplo",
    "image": "http://localhost:3001/uploads/image-main-123.jpg",
    "images": [
      "http://localhost:3001/uploads/image-add1-456.jpg",
      "http://localhost:3001/uploads/image-add2-789.jpg"
    ]
  }
}
```

### 2. Actualizar Producto - Agregar Más Imágenes

**PUT** `/api/products/:id`

```javascript
const addMoreImages = async (productId, newImages) => {
  const formData = new FormData();

  // Solo agregar las nuevas imágenes
  newImages.forEach((image) => {
    formData.append("images", image);
  });

  const response = await fetch(
    `http://localhost:3001/api/products/${productId}`,
    {
      method: "PUT",
      credentials: "include",
      body: formData,
    }
  );

  return await response.json();
};
```

**Nota:** Las nuevas imágenes se **agregan** a las existentes, no las reemplazan.

### 3. Actualizar Imagen Principal

```javascript
const updateMainImage = async (productId, newMainImage) => {
  const formData = new FormData();
  formData.append("image", newMainImage);

  const response = await fetch(
    `http://localhost:3001/api/products/${productId}`,
    {
      method: "PUT",
      credentials: "include",
      body: formData,
    }
  );

  return await response.json();
};
```

### 4. Eliminar Imagen Específica

**DELETE** `/api/products/:id/images`

```javascript
const deleteImage = async (productId, imageUrl) => {
  const response = await fetch(
    `http://localhost:3001/api/products/${productId}/images`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl }),
    }
  );

  return await response.json();
};

// Ejemplo de uso
await deleteImage("123abc", "http://localhost:3001/uploads/image-456.jpg");
```

**⚠️ Protección:** No puedes eliminar la imagen principal si hay imágenes en la galería.

## Ejemplos de UI

### Formulario de Creación

```jsx
const ProductForm = () => {
  const [mainImage, setMainImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productData = {
      name: e.target.name.value,
      description: e.target.description.value,
      price: e.target.price.value,
      stock: e.target.stock.value,
      category: e.target.category.value,
    };

    await createProduct(productData, mainImage, additionalImages);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Campos normales */}
      <input type="text" name="name" placeholder="Nombre" required />

      {/* Imagen principal */}
      <div>
        <label>Imagen Principal *</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setMainImage(e.target.files[0])}
          required
        />
      </div>

      {/* Imágenes adicionales */}
      <div>
        <label>Galería (máximo 4 imágenes)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setAdditionalImages([...e.target.files])}
        />
        <small>Seleccionadas: {additionalImages.length}/4</small>
      </div>

      <button type="submit">Crear Producto</button>
    </form>
  );
};
```

### Galería de Producto

```jsx
const ProductGallery = ({ product }) => {
  const [selectedImage, setSelectedImage] = useState(product.image);

  return (
    <div>
      {/* Imagen grande */}
      <img src={selectedImage} alt={product.name} style={{ width: "100%" }} />

      {/* Miniaturas */}
      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        {/* Imagen principal */}
        <img
          src={product.image}
          onClick={() => setSelectedImage(product.image)}
          style={{
            width: "80px",
            height: "80px",
            objectFit: "cover",
            cursor: "pointer",
            border: selectedImage === product.image ? "2px solid blue" : "none",
          }}
        />

        {/* Imágenes adicionales */}
        {product.images?.map((img, index) => (
          <img
            key={index}
            src={img}
            onClick={() => setSelectedImage(img)}
            style={{
              width: "80px",
              height: "80px",
              objectFit: "cover",
              cursor: "pointer",
              border: selectedImage === img ? "2px solid blue" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

### Admin - Gestionar Imágenes

```jsx
const ProductImageManager = ({ product }) => {
  const handleDeleteImage = async (imageUrl) => {
    if (confirm("¿Eliminar esta imagen?")) {
      await deleteImage(product._id, imageUrl);
      // Recargar producto
    }
  };

  return (
    <div>
      <h3>Imágenes del Producto</h3>

      <div>
        <h4>Imagen Principal</h4>
        <img src={product.image} style={{ width: "150px" }} />
        <p>Esta es la imagen que se muestra en listados</p>
      </div>

      <div>
        <h4>Galería ({product.images?.length || 0}/4)</h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "10px",
          }}
        >
          {product.images?.map((img, index) => (
            <div key={index} style={{ position: "relative" }}>
              <img src={img} style={{ width: "100%" }} />
              <button
                onClick={() => handleDeleteImage(img)}
                style={{ position: "absolute", top: 5, right: 5 }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

## Validaciones

### Backend

- ✅ Imagen principal: **obligatoria**
- ✅ Imágenes adicionales: **máximo 4**
- ✅ Tipos permitidos: JPEG, JPG, PNG, GIF
- ✅ Tamaño máximo: **5MB por imagen**
- ✅ No se puede eliminar imagen principal si hay galería

### Frontend (Recomendado)

```javascript
const validateImages = (mainImage, additionalImages) => {
  const errors = [];

  // Validar imagen principal
  if (!mainImage) {
    errors.push("Debes seleccionar una imagen principal");
  }

  // Validar cantidad de imágenes adicionales
  if (additionalImages.length > 4) {
    errors.push("Máximo 4 imágenes adicionales permitidas");
  }

  // Validar tamaño
  const allImages = [mainImage, ...additionalImages].filter(Boolean);
  const maxSize = 5 * 1024 * 1024; // 5MB

  allImages.forEach((img, i) => {
    if (img.size > maxSize) {
      errors.push(`Imagen ${i + 1} excede 5MB`);
    }
  });

  // Validar tipo
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
  allImages.forEach((img, i) => {
    if (!validTypes.includes(img.type)) {
      errors.push(`Imagen ${i + 1} no es un formato válido`);
    }
  });

  return errors;
};
```

## Flujo Recomendado

1. **Crear producto:**

   - Usuario sube 1 imagen principal + hasta 4 adicionales
   - Backend guarda todas las URLs

2. **Mostrar en tienda:**

   - Usar `product.image` para listados/cards
   - Usar `product.images` para galería en detalle

3. **Editar producto:**

   - Puede cambiar imagen principal
   - Puede agregar más imágenes (hasta 4 total)
   - Puede eliminar imágenes específicas

4. **Eliminar producto:**
   - Se elimina el registro (considera eliminar archivos físicos también)

## Notas Importantes

⚠️ **Nombres de campos en FormData:**

- `image` → Imagen principal (singular)
- `images` → Galería adicional (plural)

⚠️ **No mezclar:**

- Si actualizas solo datos (nombre, precio), no necesitas FormData
- Si subes imágenes, usa FormData y no envíes JSON

⚠️ **Performance:**

- Considera comprimir imágenes en frontend antes de subir
- Usa lazy loading para galerías grandes
- Genera thumbnails en backend (opcional)

## Testing

```bash
# Crear producto con múltiples imágenes
curl -X POST http://localhost:3001/api/products \
  -H "Cookie: token=..." \
  -F "name=Test Product" \
  -F "description=Test Description" \
  -F "price=100" \
  -F "stock=50" \
  -F "category=Test" \
  -F "image=@/path/to/main-image.jpg" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"

# Eliminar imagen específica
curl -X DELETE http://localhost:3001/api/products/123abc/images \
  -H "Cookie: token=..." \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"http://localhost:3001/uploads/image-456.jpg"}'
```
