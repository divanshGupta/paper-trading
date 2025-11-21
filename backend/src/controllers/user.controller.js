import { prisma } from "../utils/db.js";

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany(); 
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }       
};

// fetch balance for individual user
export const fetchBalance = async (req, res) => {
  try {
    const userId = req.user.id;  // uuid from supabase JWT

    const user = await prisma.user.findUnique({
      where: { supabaseId: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ balance: Number(user.balance) });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET profile
export const getProfile = async (req, res) => {
  try {
    // ✅ Make sure to read it from req.user (set in middleware)
    const supabaseId = req.user.id;  // this was missing

    const user = await prisma.user.findUnique({
      where: { supabaseId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        dob: true,
        gender: true,
        address: true,
        fatherName: true,
        balance: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.log("User not found, creating new entry...");
      const newUser = await prisma.user.create({
        data: {
          supabaseId,
          email: req.user.email,
          balance: 100000.0,
        },
      });
      return res.status(200).json({ user: newUser });
    }

    return res.status(200).json({ user });

  } catch (err) {
    console.error("Profile fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};


// UPDATE profile
export const updateProfile = async (req, res) => {
  try {
    const supabaseId = req.user.id; 
    const data = req.body;

    const allowedFields = [
      "name",
      "phone",
      "dob",
      "gender",
      "address",
      "fatherName"
    ];

    const updateData = Object.fromEntries(
      Object.entries(data).filter(([key]) => allowedFields.includes(key))
    );

    if (updateData.dob) {
      updateData.dob = new Date(updateData.dob);
    }

    const updatedUser = await prisma.user.update({
      where: { supabaseId },
      data: updateData,
    });

    return res.json({
      success: true,
      user: updatedUser
    });

  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
};


