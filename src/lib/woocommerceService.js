class WooCommerceService {
  constructor() {
    this.baseURL = 'https://fiodegala.com.br'; // URL da sua loja
    this.consumerKey = 'ck_5e67006c47937098df701a162be25fbb74e9d5c0';
    this.consumerSecret = 'cs_6bf2fe2d2bb181c962c053cc6c8276df208b48f2';
    this.apiVersion = 'wc/v3';
  }

  // Gerar autenticação Basic
  getAuthHeader() {
    const credentials = `${this.consumerKey}:${this.consumerSecret}`;
    return `Basic ${btoa(credentials)}`;
  }

  // Criar produto no WooCommerce
  async createProduct(productData) {
    try {
      // Criar categoria se não existir
      let categoryId = null;
      if (productData.category) {
        categoryId = await this.getOrCreateCategory(productData.category);
      }

      const woocommerceProduct = {
        name: productData.name,
        type: 'simple',
        regular_price: productData.price.toString(),
        description: productData.description || '',
        short_description: productData.short_description || '',
        sku: productData.barcode || '',
        manage_stock: true,
        stock_quantity: productData.stock || 0,
        stock_status: (productData.stock || 0) > 0 ? 'instock' : 'outofstock',
        weight: productData.weight ? productData.weight.toString() : '',
        dimensions: {
          length: productData.length ? productData.length.toString() : '',
          width: productData.width ? productData.width.toString() : '',
          height: productData.height ? productData.height.toString() : ''
        },
        categories: categoryId ? [
          {
            id: categoryId
          }
        ] : [],
        images: productData.images ? productData.images.map(img => ({
          src: img,
          position: 0
        })) : [],
        attributes: this.mapAttributes(productData),
        status: 'publish'
      };

      const response = await fetch(`${this.baseURL}/wp-json/${this.apiVersion}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify(woocommerceProduct)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao criar produto no WooCommerce: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('Produto criado no WooCommerce:', result);
      return result;

    } catch (error) {
      console.error('Erro na integração WooCommerce:', error);
      throw error;
    }
  }

  // Atualizar produto existente
  async updateProduct(woocommerceId, productData) {
    try {
      // Criar categoria se não existir
      let categoryId = null;
      if (productData.category) {
        categoryId = await this.getOrCreateCategory(productData.category);
      }

      const woocommerceProduct = {
        name: productData.name,
        regular_price: productData.price.toString(),
        description: productData.description || '',
        short_description: productData.short_description || '',
        sku: productData.barcode || '',
        manage_stock: true,
        stock_quantity: productData.stock || 0,
        stock_status: (productData.stock || 0) > 0 ? 'instock' : 'outofstock',
        weight: productData.weight ? productData.weight.toString() : '',
        dimensions: {
          length: productData.length ? productData.length.toString() : '',
          width: productData.width ? productData.width.toString() : '',
          height: productData.height ? productData.height.toString() : ''
        },
        categories: categoryId ? [
          {
            id: categoryId
          }
        ] : [],
        images: productData.images ? productData.images.map(img => ({
          src: img,
          position: 0
        })) : [],
        attributes: this.mapAttributes(productData)
      };

      const response = await fetch(`${this.baseURL}/wp-json/${this.apiVersion}/products/${woocommerceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify(woocommerceProduct)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao atualizar produto no WooCommerce: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('Produto atualizado no WooCommerce:', result);
      return result;

    } catch (error) {
      console.error('Erro na atualização WooCommerce:', error);
      throw error;
    }
  }

  // Atualizar apenas o estoque
  async updateStock(woocommerceId, stockQuantity) {
    try {
      const stockData = {
        stock_quantity: stockQuantity,
        stock_status: stockQuantity > 0 ? 'instock' : 'outofstock'
      };

      const response = await fetch(`${this.baseURL}/wp-json/${this.apiVersion}/products/${woocommerceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify(stockData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao atualizar estoque no WooCommerce: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('Estoque atualizado no WooCommerce:', result);
      return result;

    } catch (error) {
      console.error('Erro na atualização de estoque:', error);
      throw error;
    }
  }

  // Deletar produto
  async deleteProduct(woocommerceId) {
    try {
      const response = await fetch(`${this.baseURL}/wp-json/${this.apiVersion}/products/${woocommerceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao deletar produto no WooCommerce: ${errorData.message || response.statusText}`);
      }

      console.log('Produto deletado no WooCommerce');
      return true;

    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      throw error;
    }
  }

  // Buscar produto por SKU
  async getProductBySKU(sku) {
    try {
      const response = await fetch(`${this.baseURL}/wp-json/${this.apiVersion}/products?sku=${sku}`, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar produto no WooCommerce: ${response.statusText}`);
      }

      const products = await response.json();
      return products.length > 0 ? products[0] : null;

    } catch (error) {
      console.error('Erro ao buscar produto por SKU:', error);
      throw error;
    }
  }

  // Mapear atributos do produto (cor, tamanho, etc.)
  mapAttributes(productData) {
    const attributes = [];

    // Mapear cor se existir
    if (productData.color) {
      attributes.push({
        name: 'Cor',
        position: 0,
        visible: true,
        variation: true,
        options: [productData.color]
      });
    }

    // Mapear tamanho se existir
    if (productData.size) {
      attributes.push({
        name: 'Tamanho',
        position: 1,
        visible: true,
        variation: true,
        options: [productData.size]
      });
    }

    // Mapear marca se existir
    if (productData.brand) {
      attributes.push({
        name: 'Marca',
        position: 2,
        visible: true,
        variation: false,
        options: [productData.brand]
      });
    }

    return attributes;
  }

  // Buscar ou criar categoria
  async getOrCreateCategory(categoryName) {
    try {
      // Primeiro, buscar se a categoria já existe
      const searchResponse = await fetch(`${this.baseURL}/wp-json/${this.apiVersion}/products/categories?search=${encodeURIComponent(categoryName)}`, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });

      if (searchResponse.ok) {
        const categories = await searchResponse.json();
        const existingCategory = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
        
        if (existingCategory) {
          console.log('Categoria encontrada:', existingCategory.name, 'ID:', existingCategory.id);
          return existingCategory.id;
        }
      }

      // Se não encontrou, criar nova categoria
      const createResponse = await fetch(`${this.baseURL}/wp-json/${this.apiVersion}/products/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify({
          name: categoryName,
          slug: categoryName.toLowerCase().replace(/\s+/g, '-')
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(`Erro ao criar categoria: ${errorData.message || createResponse.statusText}`);
      }

      const newCategory = await createResponse.json();
      console.log('Nova categoria criada:', newCategory.name, 'ID:', newCategory.id);
      return newCategory.id;

    } catch (error) {
      console.error('Erro ao buscar/criar categoria:', error);
      throw error;
    }
  }

  // Testar conexão
  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/wp-json/${this.apiVersion}/products?per_page=1`, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na conexão: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      throw error;
    }
  }
}

export default WooCommerceService; 