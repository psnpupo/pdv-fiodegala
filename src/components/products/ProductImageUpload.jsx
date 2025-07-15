import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ProductImageUpload = ({ 
  title, 
  imageUrlPreview, 
  handleImageChange, 
  imageInputRef,
  idPrefix = "main" 
}) => {
  return (
    <div className="pt-4 border-t mt-6">
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <Input 
        type="file" 
        accept="image/*" 
        onChange={handleImageChange} 
        ref={imageInputRef} 
        className="mb-2"
        id={`${idPrefix}_image_upload`}
      />
      {imageUrlPreview && (
        <img 
          src={imageUrlPreview} 
          alt={`Preview ${title}`} 
          className="w-32 h-32 object-cover rounded-md border" 
        />
      )}
    </div>
  );
};

export default ProductImageUpload;