import { addDocument, deleteDocument, getCollection, queryCollection, updateDocument } from "../config/db.js";

const collectionName = "orders";

class orderModel {
  constructor(orderData) {
    this.userId = orderData.userId;
    this.items = orderData.items;
    this.amount = Number(orderData.amount);
    this.address = orderData.address;
    this.status = orderData.status || "Food Processing";
    this.date = orderData.date || Date.now();
    this.payment = orderData.payment || false;
  }

  async save() {
    const order = await addDocument(collectionName, {
      userId: this.userId,
      items: this.items,
      amount: this.amount,
      address: this.address,
      status: this.status,
      date: this.date,
      payment: this.payment
    });

    this._id = order._id;
    return this;
  }

  static async find(filter = {}) {
    if (filter.userId) {
      return queryCollection(collectionName, "userId", "EQUAL", filter.userId);
    }

    return getCollection(collectionName);
  }

  static async findByIdAndUpdate(id, data) {
    return updateDocument(collectionName, id, data);
  }

  static async findByIdAndDelete(id) {
    return deleteDocument(collectionName, id);
  }
}

export default orderModel;
