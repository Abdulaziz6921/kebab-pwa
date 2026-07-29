// src/services/archiveService.js

import { writeBatch, doc } from "firebase/firestore";

import { getFirestoreDB, COLLECTIONS, orderApi } from "../firebase";

import { orderDB } from "./indexeddb";

export const archiveService = {
  async archiveOldOrders(days = 30) {
    const db = getFirestoreDB();

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const orders = await orderApi.getAll();

    const groups = {};

    orders.forEach((order) => {
      // keep debts
      if (order.isDebt) return;

      // keep Man / Obed
      if (order.isObed) return;

      // keep unpaid
      if (!order.paid) return;

      // keep recent
      if (order.createdAt >= cutoff) return;
      const day = new Date(order.createdAt).toISOString().slice(0, 10);

      if (!groups[day]) groups[day] = [];

      groups[day].push(order);
    });

    for (const [day, dayOrders] of Object.entries(groups)) {
      const grouped = {};

      dayOrders.forEach((order) => {
        (order.items || []).forEach((item) => {
          const key = item.kebabType;

          if (!grouped[key]) {
            grouped[key] = {
              kebabType: item.kebabType,
              kebabName: item.kebabName,
              quantity: 0,
              revenue: 0,
              unitPrice: Number(item.unitPrice),
            };
          }

          grouped[key].quantity += Number(item.quantity);

          grouped[key].revenue +=
            Number(item.quantity) * Number(item.unitPrice);
        });
      });

      const batch = writeBatch(db);

      Object.values(grouped).forEach((item) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${item.kebabType}`;

        const [year, month, date] = day.split("-");
        const formattedDate = `${date}.${month}.${year.slice(2)}`;

        batch.set(doc(db, COLLECTIONS.ORDERS, id), {
          id,

          identifier: `archive-${day}-${item.kebabType}`,

          archived: true,

          paid: true,

          synced: true,

          createdAt: new Date(`${day}T11:00:00+05:00`).getTime(),

          updatedAt: new Date(`${day}T11:31:00+05:00`).getTime(),

          paidAt: new Date(`${day}T11:30:00+05:00`).getTime(),

          totalPrice: item.revenue,

          quantity: item.quantity,

          kebabType: item.kebabType,

          kebabName: item.kebabName,

          isDebt: false,

          isObed: false,

          tavsif: `${formattedDate} uchun jami ${item.kebabName.toLowerCase()}`,

          location: "",

          locationLabel: "",

          items: [
            {
              kebabType: item.kebabType,
              kebabName: item.kebabName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.revenue,
            },
          ],
        });
      });

      dayOrders.forEach((order) => {
        batch.delete(doc(db, COLLECTIONS.ORDERS, order.id));
      });

      await batch.commit();

      for (const order of dayOrders) {
        await orderDB.deleteOrder(order.id);
      }

      console.log(`Archived ${day}`);
    }
  },
};
