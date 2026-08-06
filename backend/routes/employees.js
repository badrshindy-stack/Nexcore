const express = require('express');
const Employee = require('../models/Employee');
const Department = require('../models/Department');

const router = express.Router();

// عرض جميع الموظفين
router.get('/', async (req, res) => {
    try {
        const employees = await Employee.find().populate('department').sort({ name: 1 });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض موظف محدد
router.get('/:id', async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id).populate('department');
        if (!employee) {
            return res.status(404).json({ error: 'الموظف غير موجود' });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// إضافة موظف جديد
router.post('/', async (req, res) => {
    try {
        const { name, position, department, phone, email, national_id, salary, hire_date, status, qualification, experience_years, shift } = req.body;

        if (!name || !position) {
            return res.status(400).json({ error: 'الاسم والمنصب مطلوبان' });
        }

        const employee = new Employee({
            name,
            position,
            department,
            phone,
            email,
            national_id,
            salary,
            hire_date,
            status: status || 'active',
            qualification,
            experience_years,
            shift
        });

        await employee.save();
        await employee.populate('department');
        res.status(201).json(employee);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'رقم الهوية موجود بالفعل' });
        }
        res.status(500).json({ error: error.message });
    }
});

// تحديث موظف
router.put('/:id', async (req, res) => {
    try {
        const { name, position, department, phone, email, national_id, salary, hire_date, status, qualification, experience_years, shift } = req.body;

        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    name,
                    position,
                    department,
                    phone,
                    email,
                    national_id,
                    salary,
                    hire_date,
                    status,
                    qualification,
                    experience_years,
                    shift,
                    updatedAt: new Date()
                }
            },
            { new: true }
        ).populate('department');

        if (!employee) {
            return res.status(404).json({ error: 'الموظف غير موجود' });
        }

        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حذف موظف
router.delete('/:id', async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);

        if (!employee) {
            return res.status(404).json({ error: 'الموظف غير موجود' });
        }

        res.json({ message: 'تم حذف الموظف بنجاح', employee });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض موظفي قسم محدد
router.get('/department/:departmentId', async (req, res) => {
    try {
        const employees = await Employee.find({ department: req.params.departmentId }).sort({ name: 1 });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض الموظفين النشطين
router.get('/active/all', async (req, res) => {
    try {
        const employees = await Employee.find({ status: 'active' }).populate('department').sort({ name: 1 });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
