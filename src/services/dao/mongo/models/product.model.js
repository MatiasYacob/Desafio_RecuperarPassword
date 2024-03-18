import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const productSchema = new Schema({
    title: String,
    description: String,
    price: Number,
    thumbnails: [String],
    code: String,
    stock: Number,
    status: {
        type: Boolean,
        default: true // Establecer el valor por defecto como true
    }
});
productSchema.plugin(mongoosePaginate);

const Product = model('Product', productSchema);

export { Product };
