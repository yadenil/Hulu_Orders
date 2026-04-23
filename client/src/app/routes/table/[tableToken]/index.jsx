import React from 'react';
import Menu from './menu';
import Cart from './cart';
import Confirmation from './confirmation';

export default function TableRoute() {
  return (
    <div>
      <h1>Table route</h1>
      <Menu />
      <Cart />
      <Confirmation />
    </div>
  );
}
