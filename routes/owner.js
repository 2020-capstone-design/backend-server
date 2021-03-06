const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { authenticateUser } = require('../utils/auth.js');


const {Owner} = require('../models');

router.get('/owner_info/:id', (req, res) => {
    Owner.findOne({
        where: {owner_id: req.params.id},
    })
        .then(user => {
            res.status(200).json({ user });
        })
        .catch(error => {
            console.error(error);
            res.status(500).json('Internal Server Error');
        })
});

router.patch('/update_owner_info', authenticateUser, async (req, res) => {
    try {
        await Owner.update({
            owner_name: req.body.name,
            owner_email: req.body.email,
            owner_birth: req.body.birth,
            owner_phone: req.body.phone,
        }, {
            where: {owner_id: req.body.username},
        })
        res.status(200).json('success');
    } catch (error) {
        console.error(error);
        res.status(500).json('Internal Server Error');
    }
})

router.patch('/update_owner_password', authenticateUser, async (req, res) => {
    try {
        const {owner_id, oldPassword, newPassword} = req.body;
        if(owner_id === '' || oldPassword === '' || newPassword === '')
            return res.status(400).json('올바르지 않은 형식입니다.');

        const user = await Owner.findOne({where: { owner_id: owner_id }});
        if (!user) {
            return res.status(409).json('가입되지 않은 회원입니다.');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        bcrypt.compare(req.body.oldPassword, user.owner_password, async (error, result) => {
            if (error) {
                res.status(500).send('Internal Server Error');
            }

            if (result) {
                await Owner.update({
                    owner_password: hashedNewPassword,
                }, {
                    where: {owner_id: owner_id}
                });
                res.status(200).json('비밀번호가 성공적으로 변경되었습니다.');
            } else {
                console.log('result', result);
                res.status(401).json('기존 비밀번호가 올바르지 않습니다.');
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json('Internal Server Error');
    }
})

router.delete('/delete_owner/:id', authenticateUser, async (req, res) => {

    console.log(req.params.id);
    try {
        const owner = await Owner.findOne({where: {owner_id: req.params.id}});
        if (!owner) {
            return res.status(409).send('해당 아이디가 없습니다.');
        }
        await Owner.destroy({where: {owner_id: req.params.id}});
        res.status(200).json('해당 계정이 삭제되었습니다.');
    } catch (error) {
        console.error(error);
        res.status(500).json('Internal Server Error');
    }
});

module.exports = router;
