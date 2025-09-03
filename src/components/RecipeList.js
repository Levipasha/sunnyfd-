import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Row, Col, Alert, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';

const RecipeList = () => {
  const [recipes, setRecipes] = useState([]);
  const [show, setShow] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState([{ name: '', per: '', totalQuantity: '', gheeFlower: '', unit: 'g' }]);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });
  
  const form = {
    title: '',
    description: '',
    category: 'cake',
    items: []
  };
  
  const [formData, setFormData] = useState({ ...form });

  // Fetch recipes from the API
  const fetchRecipes = async () => {
    try {
      const response = await fetch('https://sunny-b.onrender.com/recipes');
      const data = await response.json();
      
      if (data.success) {
        // Transform the data to match the format expected by the frontend
        const formattedRecipes = data.data.map(recipe => {
          // Ensure tableStructure exists with default values if missing
          const tableStructure = recipe.tableStructure || {
            columns: [
              { name: 'Item', type: 'item' },
              { name: 'Per', type: 'per' },
              { name: 'Total Qty', type: 'totalQty' },
              { name: 'Unit', type: 'ingredient' },
              { name: 'Ghee Flower', type: 'ingredient' }
            ],
            ingredients: ['unit', 'ghee_flower']
          };

          // Transform each item in the recipe
          const transformedItems = (recipe.items || []).map(item => {
            // Ensure ingredientValues exists
            const ingredientValues = item.ingredientValues || {};
            
            return {
              ...item,
              name: item.name || '',
              per: parseFloat(item.per) || 0,
              totalQuantity: parseFloat(item.totalQty) || 0,
              unit: ingredientValues.unit || 'g',
              gheeFlower: parseFloat(ingredientValues.ghee_flower) || 0
            };
          });

          // Ensure totals exist with default values
          const totals = recipe.totals || {
            orderTotal: transformedItems.length,
            totalQtyTotal: transformedItems.reduce((sum, item) => sum + (parseFloat(item.totalQty) || 0), 0),
            ingredientTotals: {
              ghee_flower: transformedItems.reduce((sum, item) => sum + (parseFloat(item.ingredientValues?.ghee_flower) || 0), 0)
            }
          };

          return {
            ...recipe,
            tableStructure,
            items: transformedItems,
            totals,
            // Ensure required fields have default values
            title: recipe.title || 'Untitled Recipe',
            description: recipe.description || '',
            category: recipe.category || 'cake',
            createdBy: recipe.createdBy || 'system'
          };
        });
        
        console.log('Fetched and transformed recipes:', formattedRecipes);
        setRecipes(formattedRecipes);
      } else {
        console.error('Failed to fetch recipes:', data.message);
        showAlert('Failed to load recipes: ' + (data.message || 'Unknown error'), 'danger');
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      showAlert('Failed to load recipes: ' + (error.message || 'Unknown error'), 'danger');
    }
  };

  // Show alert message
  const showAlert = (message, variant = 'success') => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ ...alert, show: false }), 5000);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleAddRecipe = () => {
    setEditingRecipe(null);
    setFormData({ ...form });
    setItems([{ name: '', per: '', totalQuantity: '', gheeFlower: '', unit: 'g' }]);
    setShow(true);
  };

  const handleEdit = (recipe) => {
    // Transform the recipe data for editing
    const transformedRecipe = {
      ...recipe,
      // Ensure all required fields exist with defaults
      title: recipe.title || '',
      description: recipe.description || '',
      category: recipe.category || 'cake',
      // Transform items if they exist
      items: (recipe.items || []).map(item => ({
        ...item,
        // Ensure all item fields exist with defaults
        name: item.name || '',
        per: item.per || '',
        // Map totalQty to totalQuantity for the form
        totalQuantity: item.totalQty || '',
        // Extract unit and gheeFlower from ingredientValues
        unit: item.ingredientValues?.unit || 'g',
        gheeFlower: item.ingredientValues?.ghee_flower || ''
      }))
    };

    setEditingRecipe(transformedRecipe);
    setFormData({
      title: transformedRecipe.title,
      description: transformedRecipe.description,
      category: transformedRecipe.category
    });
    
    // Set items, ensuring at least one empty item exists
    setItems(transformedRecipe.items.length > 0 
      ? transformedRecipe.items 
      : [{ name: '', per: '', totalQuantity: '', gheeFlower: '', unit: 'g' }]
    );
    
    setShow(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`https://sunny-b.onrender.com/recipes/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setAlert({ show: true, message: 'Recipe deleted successfully', variant: 'success' });
        fetchRecipes();
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      setAlert({ show: true, message: 'Failed to delete recipe', variant: 'danger' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions while processing
    if (isSubmitting) {
      console.log('Prevented duplicate submission');
      return;
    }
    
    // Set submitting state and disable form
    setIsSubmitting(true);
    const submitButton = e.nativeEvent.submitter;
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    
    let response;
    let data;
    let success = false;

    try {
      // Filter out empty items before processing
      const nonEmptyItems = items
        .map(item => ({
          name: (item.name || '').trim(),
          per: item.per || '0',
          totalQuantity: item.totalQuantity || '0',
          unit: item.unit || 'g',
          gheeFlower: item.gheeFlower || '0'
        }))
        .filter(item => 
          item.name !== '' || 
          item.per !== '0' || 
          item.totalQuantity !== '0' ||
          item.gheeFlower !== '0'
        );

      if (nonEmptyItems.length === 0) {
        throw new Error('Please add at least one item to the recipe');
      }

      // Validate title
      if (!formData.title || !formData.title.trim()) {
        throw new Error('Recipe title is required');
      }

      // Prepare the recipe data with proper formatting
      const recipeData = {
        title: formData.title.trim(),
        description: (formData.description || '').trim(),
        category: formData.category || 'cake',
        // Ensure table structure is always present
        tableStructure: {
          columns: [
            { name: 'Item', type: 'item' },
            { name: 'Per', type: 'per' },
            { name: 'Total Qty', type: 'totalQty' },
            { name: 'Unit', type: 'ingredient' },
            { name: 'Ghee Flower', type: 'ingredient' }
          ],
          ingredients: ['unit', 'ghee_flower']
        },
        items: nonEmptyItems.map((item, index) => ({
          name: (item.name || '').trim() || `Item ${index + 1}`,
          order: index + 1,
          per: parseFloat(item.per) || 0,
          totalQty: parseFloat(item.totalQuantity) || 0,
          ingredientValues: {
            unit: item.unit || 'g',
            ghee_flower: parseFloat(item.gheeFlower) || 0
          }
        })),
        totals: {
          orderTotal: nonEmptyItems.length,
          totalQtyTotal: nonEmptyItems.reduce((sum, item) => sum + (parseFloat(item.totalQuantity) || 0), 0),
          ingredientTotals: {
            ghee_flower: nonEmptyItems.reduce((sum, item) => sum + (parseFloat(item.gheeFlower) || 0), 0)
          }
        }
      };
      
      console.log('Sending recipe data:', JSON.stringify(recipeData, null, 2));

      const url = editingRecipe 
        ? `https://sunny-b.onrender.com/recipes/${editingRecipe._id}`
        : 'https://sunny-b.onrender.com/recipes';
      
      const method = editingRecipe ? 'PUT' : 'POST';
      
      // Add abort controller to handle timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recipeData),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        // Check if response is OK before parsing JSON
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || 
            `Server returned ${response.status} ${response.statusText}`
          );
        }
        
        data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to save recipe');
        }
        
        success = true;
        showAlert(
          `Recipe ${editingRecipe ? 'updated' : 'created'} successfully`,
          'success'
        );
        
        // Reset form state
        setFormData({ 
          title: '',
          description: '',
          category: 'cake' 
        });
        setItems([{ 
          name: '', 
          per: '', 
          totalQuantity: '', 
          gheeFlower: '', 
          unit: 'g' 
        }]);
        setEditingRecipe(null);
        setShow(false);
        
        // Refresh the recipes list
        await fetchRecipes();
      } catch (error) {
        // If there's a JSON parse error, include the response text in the error
        if (error instanceof SyntaxError) {
          const text = await response.text();
          console.error('Failed to parse response:', text);
          throw new Error('Invalid response from server');
        }
        throw error; // Re-throw other errors
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      let errorMessage = 'Failed to save recipe. ';
      
      if (error.name === 'AbortError') {
        errorMessage += 'Request timed out. Please try again.';
      } else if (error.message) {
        errorMessage += error.message;
      }
      
      showAlert(errorMessage, 'danger');
    } finally {
      // Always reset the submit button state
      setIsSubmitting(false);
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: '', per: '', totalQuantity: '', gheeFlower: '', unit: 'g' }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems.length ? newItems : [{ name: '', per: '', totalQuantity: '', gheeFlower: '', unit: 'g' }]);
  };

  const calculateTotalGheeFlower = () => {
    return items.reduce((total, item) => total + (parseFloat(item.gheeFlower) || 0), 0).toFixed(2);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Recipes</h2>
        <Button variant="primary" onClick={handleAddRecipe}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Add Recipe
        </Button>
      </div>

      {alert.show && (
        <Alert variant={alert.variant} onClose={() => setAlert({ ...alert, show: false })} dismissible>
          {alert.message}
        </Alert>
      )}

      <div className="table-responsive">
        <Table striped bordered hover className="align-middle">
          <thead className="table-dark">
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Category</th>
              <th>Items</th>
              <th>Total Ghee Flower</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recipes.length > 0 ? (
              recipes.map((recipe) => (
                <tr key={recipe._id}>
                  <td>{recipe.title}</td>
                  <td>{recipe.description}</td>
                  <td className="text-capitalize">{recipe.category}</td>
                  <td>
                    <ul className="list-unstyled mb-0">
                      {recipe.items && recipe.items.map((item, i) => (
                        <li key={i} className="small">
                          {item.name}: {item.per} {item.unit} (Total: {item.totalQuantity} {item.unit})
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    {recipe.items && recipe.items.reduce((total, item) => 
                      total + (parseFloat(item.gheeFlower) || 0), 0).toFixed(2)}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => handleEdit(recipe)}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => handleDelete(recipe._id)}
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  No recipes found. Click 'Add Recipe' to get started.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <Modal show={show} onHide={() => setShow(false)} size="xl" centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton className="bg-dark text-white">
            <Modal.Title>{editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Recipe Title</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required 
                    placeholder="Enter recipe title"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="cake">Cake</option>
                    <option value="pastry">Pastry</option>
                    <option value="bread">Bread</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter recipe description"
                required 
              />
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Recipe Items</h5>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={addItem}
              >
                <FontAwesomeIcon icon={faPlus} className="me-1" /> Add Item
              </Button>
            </div>
            
            <div className="table-responsive mb-3">
              <Table bordered hover size="sm">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Item Name</th>
                    <th>Per (Qty)</th>
                    <th>Total Quantity</th>
                    <th>Unit</th>
                    <th>Ghee Flower</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="align-middle">{index + 1}</td>
                      <td>
                        <Form.Control
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          placeholder="Item name"
                          required
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.per}
                          onChange={(e) => handleItemChange(index, 'per', e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.totalQuantity}
                          onChange={(e) => handleItemChange(index, 'totalQuantity', e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </td>
                      <td>
                        <Form.Select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          required
                        >
                          <option value="g">Grams (g)</option>
                          <option value="kg">Kilograms (kg)</option>
                          <option value="ml">Milliliters (ml)</option>
                          <option value="l">Liters (l)</option>
                          <option value="tsp">Teaspoons (tsp)</option>
                          <option value="tbsp">Tablespoons (tbsp)</option>
                          <option value="cup">Cups</option>
                          <option value="pcs">Pieces</option>
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.gheeFlower}
                          onChange={(e) => handleItemChange(index, 'gheeFlower', e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </td>
                      <td className="align-middle">
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          title="Remove item"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="5" className="text-end fw-bold">Total Ghee Flower:</td>
                    <td className="fw-bold">{calculateTotalGheeFlower()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="outline-secondary" onClick={() => setShow(false)}>
              <FontAwesomeIcon icon={faTimes} className="me-1" /> Cancel
            </Button>
            <Button variant="primary" type="submit">
              <FontAwesomeIcon icon={editingRecipe ? faSave : faPlus} className="me-1" />
              {editingRecipe ? 'Update Recipe' : 'Save Recipe'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default RecipeList;
