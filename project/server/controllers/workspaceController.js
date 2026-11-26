const Workspace = require('../models/Workspace');
const Document = require('../models/Document');
const Message = require('../models/Message');
const User = require('../models/User');

exports.getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user._id,
    })
      .populate('owner', 'name avatar')
      .populate('members.user', 'name avatar');

    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    const workspace = await Workspace.create({
      name,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });

    const populated = await workspace.populate([
      { path: 'owner', select: 'name avatar' },
      { path: 'members.user', select: 'name avatar' },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.inviteMember = async (req, res) => {
  try {
    const { username, email, role } = req.body;
    const identifier = String(username || email || '').trim();
    if (!identifier) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const inviterMembership = workspace.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );
    const isOwner = workspace.owner.toString() === req.user._id.toString();
    if (!isOwner && inviterMembership?.role !== 'editor') {
      return res.status(403).json({ message: 'Only workspace owners and editors can invite members' });
    }

    if (role && !['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid member role' });
    }

    const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchingUsers = await User.find({
      $or: [
        { username: new RegExp(`^${escapedIdentifier}$`, 'i') },
        { email: identifier.toLowerCase() },
        { email: new RegExp(`^${escapedIdentifier}@`, 'i') },
        { name: new RegExp(`^${escapedIdentifier}$`, 'i') },
      ],
    })
      .select('_id')
      .limit(2);

    if (matchingUsers.length === 0) {
      return res.status(404).json({ message: 'No account found for that username or email' });
    }
    if (matchingUsers.length > 1) {
      return res.status(409).json({ message: 'More than one account matches that name. Use the account email instead.' });
    }

    const userToInvite = matchingUsers[0];
    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === userToInvite._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    workspace.members.push({
      user: userToInvite._id,
      role: role || 'editor',
    });
    await workspace.save();

    const populated = await workspace.populate([
      { path: 'owner', select: 'name avatar' },
      { path: 'members.user', select: 'name avatar' },
    ]);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const membership = workspace.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );
    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return res.status(403).json({ message: 'Only workspace owners and editors can delete this workspace' });
    }

    const documents = await Document.find({ workspace: workspace._id }).select('_id');
    const documentIds = documents.map((document) => document._id);
    if (documentIds.length > 0) {
      await Message.deleteMany({ document: { $in: documentIds } });
      await Document.deleteMany({ _id: { $in: documentIds } });
    }
    await Workspace.deleteOne({ _id: workspace._id });

    res.json({ message: 'Workspace deleted' });
  } catch (err) {
    console.error('Workspace deletion error:', err.message);
    res.status(500).json({ message: 'Failed to delete workspace' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can remove members' });
    }

    if (req.params.userId === workspace.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove the owner' });
    }

    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await workspace.save();

    const populated = await workspace.populate([
      { path: 'owner', select: 'name avatar' },
      { path: 'members.user', select: 'name avatar' },
    ]);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
