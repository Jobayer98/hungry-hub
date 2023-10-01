const CustomError = require("../utility/CustomError");
const MenuModel = require("../models/menuModel");
const showMenus = async(req, res, next) => {
    try {
        const menu = await MenuModel.find();
        if (!menu){
            throw new CustomError("Menus not found", 404);
        }

        res.status(200).json({
            success: true,
            data: menu
        })
    } catch (error) {
        next( new CustomError(error, 400) );
        
    }
}

const showMenuItem = async(req, res, next) => {
    try {
        const { menuId } = req.params;
        const item = await MenuModel.findById(menuId);
        
        if (!item){
            throw new CustomError("Item not found", 404);
        }

        res.status(200).json({
            success: true,
            data: item
        })
    } catch (error) {
        next( new CustomError(error, 400) );
    }
}

const createMenu = async(req, res, next) => {
    try {
        const item = await MenuModel.create(req.body);
        
        res.status(201).json({
            success: true,
            data: item
        })

    } catch (error) {
        next( new CustomError(error, 400) );
    }
}

const updateMenuItem = async(req, res, next) => {
    try {
        const { menuId } = req.params;
        const updates = Object.keys(req.body);
        const validKeys = ["name", "description", "price"];

        const isValidKey = updates.every((key) => {
            return validKeys.includes(key);
        })

        if(!isValidKey){
            throw new CustomError("Invalid updates", 400);
        }

        const item = await MenuModel.findByIdAndUpdate(menuId, req.body, { new: true, runValidators: true });
        
        if (!item){
            throw new CustomError("Item not found", 404);
        }

        res.status(200).json({
            success: true,
            data: item
        })
    } catch (error) {
        next( new CustomError(error, 400) );
    }
}

const deleteMenuItem = async(req, res, next) => {
    try {
        const { menuId } = req.params;
        const item = await MenuModel.findByIdAndDelete(menuId);
        
        if (!item){
            throw new CustomError("Item not found", 404);
        }

        res.status(200).json({
            success: true,
            data: item
        })
    } catch (error) {
        next( new CustomError(error, 400) );
    }
}

module.exports = {
    showMenus,
    showMenuItem,
    createMenu,
    updateMenuItem,
    deleteMenuItem
}