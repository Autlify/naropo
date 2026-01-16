import { generateReactHelpers } from '@uploadthing/react'
import type { OurFileRouter } from '@/app/api/uploadthing/core'
import { generateUploader, generateUploadButton, generateUploadDropzone} from "@uploadthing/react";


 const UploadButton = generateUploadButton<OurFileRouter>();
 const UploadDropzone = generateUploadDropzone<OurFileRouter>();
 const Uploader = generateUploader<OurFileRouter>();

 
export { UploadButton, UploadDropzone, Uploader };

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>()



{/* The code below was replaced with the code above  **/}
// import { generateComponents } from '@uploadthing/react'
// import { generateReactHelpers } from '@uploadthing/react/hooks'

// import type { OurFileRouter } from '@/app/api/uploadthing/core'

// export const { UploadButton, UploadDropzone, Uploader } =
//   generateComponents<OurFileRouter>()

// export const { useUploadThing, uploadFiles } =
//   generateReactHelpers<OurFileRouter>()

