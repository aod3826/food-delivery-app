import { addDocument, getDocument, queryCollection, updateDocument } from "../config/db.js";

const collectionName = "users";

class userModel {
  constructor(userData) {
    this.name = userData.name;
    this.email = userData.email;
    this.password = userData.password;
    this.cartData = userData.cartData || {};
  }

  async save() {
    const user = await addDocument(collectionName, {
      name: this.name,
      email: this.email,
      password: this.password,
      cartData: this.cartData
    });

    this._id = user._id;
    return this;
  }

  static async findOne(filter = {}) {
    if (!filter.email) {
      return null;
    }

    const users = await queryCollection(collectionName, "email", "EQUAL", filter.email);
    return users[0] || null;
  }

  static async findById(id) {
    return getDocument(collectionName, id);
  }

  static async findByIdAndUpdate(id, data) {
    return updateDocument(collectionName, id, data);
  }
}

export default userModel;
