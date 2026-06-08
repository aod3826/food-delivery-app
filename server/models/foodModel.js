import { addDocument, deleteDocument, getCollection, getDocument } from "../config/db.js";

const collectionName = "foods";

class foodModel {
  constructor(foodData) {
    this.name = foodData.name;
    this.description = foodData.description;
    this.price = Number(foodData.price);
    this.image = foodData.image;
    this.category = foodData.category;
  }

  async save() {
    const food = await addDocument(collectionName, {
      name: this.name,
      description: this.description,
      price: this.price,
      image: this.image,
      category: this.category
    });

    this._id = food._id;
    return this;
  }

  static async find() {
    return getCollection(collectionName);
  }

  static async findById(id) {
    return getDocument(collectionName, id);
  }

  static async findByIdAndDelete(id) {
    return deleteDocument(collectionName, id);
  }
}

export default foodModel;
