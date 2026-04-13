const VALID_TYPES = ["HOTEL", "CAMPING", "RESIDENCE", "AUBERGE", "VILLAGE"];

/**
 * Build filter object from query parameters for hebergement search
 * @param {Object} query - Request query parameters
 * @returns {Object} MongoDB filter object
 */
export function buildHebergementFilter(query) {
    const {
        q,
        type,
        region,
        classification,
        lat,
        long,
        radius
    } = query;

    const filter = {};

    // Text search filter
    if (q) {
        filter.$or = [
            { nom: { $regex: q, $options: 'i' } },
            { 'localisation.commune': { $regex: q, $options: 'i' } },
            { 'localisation.region': { $regex: q, $options: 'i' } }
        ];
    }

    // Type filter with validation
    if (type) {
        const normalizedType = type.toUpperCase();
        if (!VALID_TYPES.includes(normalizedType)) {
            throw new Error(`Invalid type: ${type}. Valid types are: ${VALID_TYPES.join(', ')}`);
        }
        filter.type = normalizedType;
    }

    // Region filter
    if (region) {
        filter['localisation.region'] = { $regex: region, $options: 'i' };
    }

    // Classification filter
    if (classification) {
        filter.classification = classification;
    }

    // Geolocation filter
    if (lat && long && radius) {
        filter['localisation.coordinates'] = {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(long), parseFloat(lat)]
                },
                $maxDistance: parseFloat(radius) * 1000
            }
        };
    }

    return filter;
}

/**
 * Validate pagination parameters
 * @param {number} limit - Number of items per page
 * @param {number} page - Page number
 * @returns {Object} { limit, offset }
 */
export function validatePagination(limit, page) {
    const parsedLimit = parseInt(limit) || 20;
    const parsedPage = parseInt(page) || 1;

    if (parsedLimit > 100) {
        throw new Error('Limit cannot exceed 100 items');
    }

    if (parsedLimit < 1) {
        throw new Error('Limit must be at least 1');
    }

    if (parsedPage < 1) {
        throw new Error('Page must be at least 1');
    }

    const offset = (parsedPage - 1) * parsedLimit;

    return { limit: parsedLimit, offset };
}