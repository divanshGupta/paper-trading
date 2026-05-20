import { prisma } from "../utils/db.js";

// Get all users api is deprecated as of 20-05-26

// fetch balance for individual user
export const fetchBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { supabaseId: userId },
      select: { balance: true }, // only this column
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
// optimized getProfile (single DB call)
export const getProfile = async (req, res) => {
  try {
    const supabaseId = req.user.id;

    // upsert: returns existing row or creates & returns new one
    const user = await prisma.user.upsert({
      where: { supabaseId },
      update: {}, // no-op update when exists
      create: {
        supabaseId,
        email: req.user.email,
        balance: 100000.0,
        // set any other defaults you want
      },
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


