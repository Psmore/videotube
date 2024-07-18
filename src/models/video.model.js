import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String,
            required: true
        },
        thumbnail: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number,
            default: 0
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate);
//converting video duration to mb.
// we're trying to make a pre hook for converting video size to mb from bytes 
// we're getting error the value is increasing .

// changing video descriptions to lowercase because we're using it for searching
//videoSchema.pre("save", function(next) {
//    if(!this.isModified("description")) return next();
//
//    this.description = this.description.toLowerCase();
//    next();
//})
// there is no need for this pre hooks because we're searching it with $regex by incasesensitive way
export const Video = mongoose.model("Video", videoSchema);