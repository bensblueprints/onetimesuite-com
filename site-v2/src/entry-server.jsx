import React from 'react';
import { renderToString } from 'react-dom/server';
import ProductPage from './ProductPage.jsx';

export function render(product) {
  return renderToString(<ProductPage product={product} />);
}
