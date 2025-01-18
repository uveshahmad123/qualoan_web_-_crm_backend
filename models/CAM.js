import mongoose from "mongoose";


const camSchema = new mongoose.Schema(
    {
        leadNo:{
            type: String,
            required: true
        },
        leadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lead",
        },
        details: {
            type: Object,
            required: true,
        },
    },
    { timestamps: true }
);

const CamDetails = mongoose.model("CamDetail", camSchema);
export default CamDetails;
