import pool from '../../../lib/pool';
import { auth } from '../../../utils/auth';
import { NextApiRequest, NextApiResponse } from 'next';

const edit = async (req: NextApiRequest, res: NextApiResponse) => {
	if (!(await auth(req))) return res.status(401).json({ message: 'Unauthorized' });
	try {
		await pool.query(
			`
			UPDATE documents
			SET name = ?, month = ?, year = ?
			WHERE id = ?
		`,
			[req.body.name, req.body.month, req.body.year, req.body.id],
		);
		res.status(200).json({ status: 'success' });
	} catch (err) {
		res.status(500).json({ status: 'error' });
	}
};

export default edit;
