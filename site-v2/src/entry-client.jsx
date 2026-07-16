import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import ProductPage from './ProductPage.jsx';
import './styles.css';

const product = window.__PRODUCT__;
if (product) {
  hydrateRoot(document.getElementById('root'), <ProductPage product={product} />);
}
