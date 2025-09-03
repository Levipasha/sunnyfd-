import React from 'react';
import {
  CrossUpdateBlock,
  QameerBlock,
  MawaBlock,
  OsamaniaBlock,
  SaltItemsBlock,
  ShowroomBlock,
  DynamicBlock
} from './blocks';


const BlockSelector = ({
  activeTab,
  isAuthenticated,
  inventory,
  setInventory,
  updateInventoryItem,
  mawaData,
  setMawaData,
  handleMawaChange,
  crossData,
  setCrossData,
  qameerData,
  setQameerData,
  osmaniaData,
  setOsmaniaData,
  saltItemsData,
  setSaltItemsData,
  showroomData,
  setShowroomData,
  mainCategories
}) => {


  const blockProps = {
    isAuthenticated,
    inventory,
    setInventory,
    updateInventoryItem,
    activeTab,
    crossData,
    setCrossData,
    qameerData,
    setQameerData,
    osmaniaData,
    setOsmaniaData,
    saltItemsData,
    setSaltItemsData,
    showroomData,
    setShowroomData
  };

  const mawaBlockProps = {
    ...blockProps,
    mawaData,
    setMawaData,
    handleMawaChange
  };

  // Handle dynamic categories (created from ONE section)
  if (activeTab.startsWith('main:')) {
    const categoryId = activeTab.replace('main:', '');
    const category = mainCategories.find(cat => cat.id.toString() === categoryId);
    
    if (category) {
      return (
        <DynamicBlock
          {...blockProps}
          categoryName={category.name}
          categoryId={category.id}
        />
      );
    }
  }

  switch (activeTab) {
    case 'crossUpdate':
      return <CrossUpdateBlock {...blockProps} />;
    case 'qameer':
      return <QameerBlock {...blockProps} />;
    case 'mawa':
      return <MawaBlock {...mawaBlockProps} />;
    case 'osamania':
      return <OsamaniaBlock {...blockProps} />;
    case 'saltItems':
      return <SaltItemsBlock {...blockProps} />;
    case 'showroom':
      return <ShowroomBlock {...blockProps} />;
    default:
      return (
        <div className="alert alert-info">
          <h4>Welcome to Inventory Management System</h4>
          <p>Please select a block from the navigation above to get started.</p>
        </div>
      );
  }
};

export default BlockSelector;
